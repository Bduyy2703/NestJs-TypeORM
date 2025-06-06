import { Injectable, BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Discount } from "../discount/entity/discount.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { Address } from "../address/entity/address.entity";
import { User } from "../users/entities/user.entity";
import { Invoice } from "../invoice/entity/invoice.entity";
import { InvoiceItem } from "../invoice/entity/invoiceItem.entity";
import { CreateInvoiceDto, InvoiceResponseDto } from "./dto/invoice.dto";
import { VnpayService } from "./service/vnpay.service";
import { PaymentMethod } from "./dto/payment.dto";
import { CartService } from "../cart/cart.service";
import { UpdateCartItemDto } from "../cart/dto/update-cartItem.dto";
import { InvoiceDiscount } from "../invoice/entity/invoice-discount.entity";
import { InvoiceStatus } from "../invoice/dto/invoice.dto";
import { NotificationService } from "../notification/notify.service";

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        @InjectRepository(Discount)
        private discountRepo: Repository<Discount>,
        @InjectRepository(ProductDetails)
        private productDetailRepo: Repository<ProductDetails>,
        @InjectRepository(Address)
        private addressRepo: Repository<Address>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>,
        @InjectRepository(InvoiceItem)
        private invoiceItemRepo: Repository<InvoiceItem>,
        private readonly vnpayService: VnpayService,
        private readonly cartService: CartService,
        private readonly notificationService: NotificationService,
    ) { }

    async createInvoice(dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
        const {
            userId,
            productDetails,
            discountIds,
            address,
            paymentMethod,
            totalProductAmount,
            shippingFee,
            shippingFeeDiscount,
            productDiscount,
            finalTotal,
        } = dto;

        const currentDate = new Date();

        return await this.invoiceRepo.manager.transaction(async transactionalEntityManager => {
            // 1. Kiểm tra user
            const user = await transactionalEntityManager.findOne(User, { where: { id: userId } });
            if (!user) {
                throw new BadRequestException(`Người dùng với ID ${userId} không tồn tại`);
            }

            // 2. Xử lý địa chỉ giao hàng
            let addressId: number;
            if (address.id) {
                const existingAddress = await transactionalEntityManager.findOne(Address, { where: { id: address.id } });
                if (!existingAddress) {
                    throw new BadRequestException(`Địa chỉ với ID ${address.id} không tồn tại`);
                }
                addressId = existingAddress.id;
            } else {
                const newAddress = transactionalEntityManager.create(Address, {
                    street: address.street,
                    city: address.city,
                    country: address.country,
                    userId: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                const savedAddress = await transactionalEntityManager.save(Address, newAddress);
                addressId = savedAddress.id;
            }

            // 3. Kiểm tra productDetails và tồn kho
            let calculatedTotalProductAmount = 0;
            const invoiceItems: InvoiceItem[] = [];
            const productDetailIds = productDetails.map(item => item.productDetailId);
            const productDetailsData = await transactionalEntityManager.find(ProductDetails, {
                where: { id: In(productDetailIds) },
                relations: ['product'],
            });
            const productDetailsMap = new Map(productDetailsData.map(pd => [pd.id, pd]));

            for (const item of productDetails) {
                const productDetail = productDetailsMap.get(item.productDetailId);
                if (!productDetail) {
                    throw new BadRequestException(`Sản phẩm với ID ${item.productDetailId} không tồn tại`);
                }
                if (!productDetail.product) {
                    throw new BadRequestException(`Sản phẩm với ID ${item.productDetailId} không có thông tin sản phẩm liên quan`);
                }
                if (productDetail.stock < item.quantity) {
                    throw new BadRequestException(`Sản phẩm với ID ${item.productDetailId} không đủ số lượng tồn kho`);
                }
                const price = productDetail.product.finalPrice;
                calculatedTotalProductAmount += price * item.quantity;

                const invoiceItem = transactionalEntityManager.create(InvoiceItem, {
                    productDetailId: item.productDetailId,
                    quantity: item.quantity,
                    price: price,
                    subtotal: price * item.quantity,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                invoiceItems.push(invoiceItem);
            }

            if (calculatedTotalProductAmount !== totalProductAmount) {
                throw new BadRequestException(`Tổng tiền sản phẩm không khớp: tính được ${calculatedTotalProductAmount}, nhưng nhận được ${totalProductAmount}`);
            }

            // 4. Kiểm tra và áp dụng Discount
            let calculatedShippingFeeDiscount = 0;
            let calculatedProductDiscount = 0;
            const discountMap = new Map<number, Discount>();

            if (discountIds && discountIds.length > 0) {
                let shippingDiscountApplied = false;
                let totalDiscountApplied = false;

                const discounts = await transactionalEntityManager.find(Discount, {
                    where: { id: In(discountIds), isActive: true },
                });
                discounts.forEach(d => discountMap.set(d.id, d));

                for (const discountId of discountIds) {
                    const discount = discountMap.get(discountId);
                    if (!discount) {
                        throw new BadRequestException(`Mã giảm giá với ID ${discountId} không tồn tại`);
                    }
                    if (discount.quantity <= 0) {
                        throw new BadRequestException(`Mã giảm giá với ID ${discountId} đã hết số lượng`);
                    }
                    if (discount.startDate > currentDate || (discount.endDate && discount.endDate < currentDate)) {
                        throw new BadRequestException(`Mã giảm giá với ID ${discountId} không còn hạn`);
                    }

                    const discountValue = parseFloat(discount.discountValue.toString());
                    if (isNaN(discountValue)) {
                        throw new BadRequestException(`Giá trị giảm giá của mã ${discountId} không hợp lệ`);
                    }

                    let appliedDiscountValue = discount.discountType === "FIXED" ? discountValue :
                        discount.condition === "SHIPPING" ? (shippingFee * discountValue) / 100 : (totalProductAmount * discountValue) / 100;

                    if (discount.condition === "SHIPPING") {
                        if (shippingDiscountApplied) {
                            throw new BadRequestException(`Đã áp dụng mã giảm giá cho phí ship, không thể áp dụng thêm mã ${discountId}`);
                        }
                        calculatedShippingFeeDiscount = Math.min(appliedDiscountValue, shippingFee);
                        shippingDiscountApplied = true;
                    } else if (discount.condition === "TOTAL") {
                        if (totalDiscountApplied) {
                            throw new BadRequestException(`Đã áp dụng mã giảm giá cho tổng tiền, không thể áp dụng thêm mã ${discountId}`);
                        }
                        calculatedProductDiscount = Math.min(appliedDiscountValue, totalProductAmount);
                        totalDiscountApplied = true;
                    }
                }

                if (calculatedShippingFeeDiscount !== shippingFeeDiscount) {
                    throw new BadRequestException(`Số tiền giảm giá cho phí ship không khớp: tính được ${calculatedShippingFeeDiscount}, nhưng nhận được ${shippingFeeDiscount}`);
                }
                if (calculatedProductDiscount !== productDiscount) {
                    throw new BadRequestException(`Số tiền giảm giá cho sản phẩm không khớp: tính được ${calculatedProductDiscount}, nhưng nhận được ${productDiscount}`);
                }
            } else if (shippingFeeDiscount !== 0 || productDiscount !== 0) {
                throw new BadRequestException(`Không có mã giảm giá, nhưng số tiền giảm giá không phải 0`);
            }

            // 5. Kiểm tra tổng tiền cuối cùng
            const calculatedFinalTotal = (totalProductAmount - productDiscount) + (shippingFee - shippingFeeDiscount);
            if (calculatedFinalTotal !== finalTotal) {
                throw new BadRequestException(`Tổng tiền cuối cùng không khớp: tính được ${calculatedFinalTotal}, nhưng nhận được ${finalTotal}`);
            }

            // 6. Tạo và lưu Invoice
            const invoice = transactionalEntityManager.create(Invoice, {
                userId,
                addressId,
                paymentMethod,
                totalProductAmount,
                shippingFee,
                shippingFeeDiscount,
                productDiscount,
                finalTotal,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await transactionalEntityManager.save(Invoice, invoice);

            // 7. Gán invoiceId và lưu InvoiceItem
            invoiceItems.forEach(item => {
                item.invoiceId = invoice.id;
                item.price = parseInt(item.price.toString());
                item.subTotal = item.price * item.quantity;
            });
            await transactionalEntityManager.save(InvoiceItem, invoiceItems);

            if (discountIds && discountIds.length > 0) {
                const invoiceDiscounts = discountIds.map(discountId => {
                    const invoiceDiscount = transactionalEntityManager.create(InvoiceDiscount, {
                        invoiceId: invoice.id,
                        discountId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    this.logger.log(`Creating InvoiceDiscount: ${JSON.stringify(invoiceDiscount)}`);
                    return invoiceDiscount;
                });
                await transactionalEntityManager.save(InvoiceDiscount, invoiceDiscounts);
                this.logger.log(`Saved InvoiceDiscounts for invoice ${invoice.id}`);
            }
            // 8. Trừ số lượng trong giỏ hàng
            for (const item of productDetails) {
                const cartItem = await this.cartService.findCartItemByProductDetailId(userId, item.productDetailId);
                if (cartItem) {
                    const newQuantity = cartItem.quantity - item.quantity;
                    if (newQuantity <= 0) {
                        await this.cartService.removeCartItem(cartItem.id);
                    } else {
                        await this.cartService.updateCartItem(cartItem.id, { quantity: newQuantity });
                    }
                }
            }

            // 9. Xử lý tồn kho và discount dựa trên paymentMethod
            if (paymentMethod === PaymentMethod.COD) {
                for (const item of productDetails) {
                    const productDetail = productDetailsMap.get(item.productDetailId)!;
                    productDetail.stock -= item.quantity;
                    productDetail.sold = (productDetail.sold || 0) + item.quantity;
                    await transactionalEntityManager.save(ProductDetails, productDetail);
                }
                if (discountIds && discountIds.length > 0) {
                    for (const discountId of discountIds) {
                        const discount = discountMap.get(discountId)!;
                        discount.quantity -= 1;
                        await transactionalEntityManager.save(Discount, discount);
                    }
                }
            }
            const message = paymentMethod === PaymentMethod.COD
                ? `Đơn hàng #${invoice.id} đã được tạo thành công (COD)`
                : `Đang chuyển hướng đến VNPay để thanh toán hóa đơn #${invoice.id}`;
                await this.notificationService.sendNotification({
                    userId, // Gửi thông báo đến admin, userId để backend biết người dùng nào tạo đơn
                    message: `Người dùng ${user.username} đã đặt đơn hàng #${invoice.id}`,
                    type: 'INVOICE_CREATED',
                    source: 'USER', // Thông báo từ người dùng
                });

            // 10. Xử lý thanh toán và trả về response
            if (paymentMethod === PaymentMethod.COD) {
                this.logger.log(`Invoice ${invoice.id} created successfully with COD`);
                return {
                    id: invoice.id,
                    userId,
                    addressId,
                    paymentMethod,
                    totalProductAmount,
                    shippingFee,
                    shippingFeeDiscount,
                    productDiscount,
                    finalTotal,
                    status: invoice.status,
                    createdAt: invoice.createdAt,
                    updatedAt: invoice.updatedAt,
                    message: "Đơn hàng đã được tạo thành công (COD)",
                };
            } else if (paymentMethod === PaymentMethod.VNPAY) {
                const paymentUrl = await this.vnpayService.processVnpayPayment(invoice, finalTotal);
                this.logger.log(`Invoice ${invoice.id} created, redirecting to VNPay: ${paymentUrl}`);
                return {
                    id: invoice.id,
                    userId,
                    addressId,
                    paymentMethod,
                    totalProductAmount,
                    shippingFee,
                    shippingFeeDiscount,
                    productDiscount,
                    finalTotal,
                    status: invoice.status,
                    createdAt: invoice.createdAt,
                    updatedAt: invoice.updatedAt,
                    message: "Đang chuyển hướng đến VNPay để thanh toán",
                    paymentUrl,
                };
            } else {
                throw new BadRequestException(`Phương thức thanh toán ${paymentMethod} không được hỗ trợ`);
            }
        });
    }

    async processVnpayIpn(params: any): Promise<{
        rspCode: string;
        message: string;
        invoice: Invoice;
        redirectUrl: string;
    }> {

        return this.vnpayService.processVnpayIpn(params);
    }

    async retryPayment(invoiceId: number, paymentMethod: PaymentMethod): Promise<InvoiceResponseDto> {
        return await this.invoiceRepo.manager.transaction(async transactionalEntityManager => {
            // 1. Kiểm tra invoice
            const invoice = await transactionalEntityManager.findOne(Invoice, {
                where: { id: invoiceId },
                relations: ["items"]
            });
            if (!invoice) {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} không tồn tại`);
            }
            if (invoice.status === "PAID") {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} đã được thanh toán thành công`);
            }
            if (invoice.status === "CANCELLED") {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} đã bị hủy, không thể thanh toán lại`);
            }
            if (invoice.paymentMethod === PaymentMethod.COD) {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} sử dụng phương thức COD, không thể thanh toán lại`);
            }

            // 2. Kiểm tra lại số lượng tồn kho
            const invoiceItems = await transactionalEntityManager.find(InvoiceItem, { where: { invoiceId } });
            const productDetailIds = invoiceItems.map(item => item.productDetailId);
            const productDetails = await transactionalEntityManager.find(ProductDetails, {
                where: { id: In(productDetailIds) },
            });
            const productDetailsMap = new Map(productDetails.map(pd => [pd.id, pd]));

            for (const item of invoiceItems) {
                const productDetail = productDetailsMap.get(item.productDetailId);
                if (!productDetail) {
                    throw new BadRequestException(`Sản phẩm với ID ${item.productDetailId} không tồn tại`);
                }
                if (productDetail.stock < item.quantity) {
                    invoice.status = "CANCELLED";
                    invoice.updatedAt = new Date();
                    await transactionalEntityManager.save(Invoice, invoice);
                    throw new BadRequestException(`Thanh toán lại thất bại: Sản phẩm với ID ${item.productDetailId} không đủ số lượng tồn kho`);
                }
            }

            // 3. Kiểm tra lại số lượng discount (nếu có)
            const invoiceDiscounts = await transactionalEntityManager.find(InvoiceDiscount, { where: { invoiceId } });

            console.log('invoiceDiscounts', invoiceDiscounts)
            const discountIds = invoiceDiscounts.map(id => id.discountId);
            console.log('discountIds', discountIds)
            if (discountIds.length > 0) {
                const discounts = await transactionalEntityManager.find(Discount, { where: { id: In(discountIds) } });
                const discountMap = new Map(discounts.map(d => [d.id, d]));

                for (const discountId of discountIds) {
                    const discount = discountMap.get(discountId);
                    if (!discount || discount.quantity <= 0) {
                        invoice.status = "CANCELLED";
                        invoice.updatedAt = new Date();
                        await transactionalEntityManager.save(Invoice, invoice);
                        throw new BadRequestException(`Thanh toán lại thất bại: Mã giảm giá với ID ${discountId} không còn số lượng hoặc không hợp lệ`);
                    }
                }
            }

            // 4. Thực hiện thanh toán lại
            if (paymentMethod === PaymentMethod.VNPAY) {
                const paymentUrl = await this.vnpayService.processVnpayPayment(invoice, invoice.finalTotal);
                this.logger.log(`Retry payment for invoice ${invoice.id}, redirecting to VNPay: ${paymentUrl}`);
                return {
                    id: invoice.id,
                    userId: invoice.userId,
                    addressId: invoice.addressId,
                    paymentMethod: invoice.paymentMethod,
                    totalProductAmount: invoice.totalProductAmount,
                    shippingFee: invoice.shippingFee,
                    shippingFeeDiscount: invoice.shippingFeeDiscount,
                    productDiscount: invoice.productDiscount,
                    finalTotal: invoice.finalTotal,
                    status: invoice.status,
                    createdAt: invoice.createdAt,
                    updatedAt: invoice.updatedAt,
                    message: "Đang chuyển hướng đến VNPay để thanh toán lại",
                    paymentUrl,
                };
            } else {
                throw new BadRequestException(`Phương thức thanh toán ${paymentMethod} không được hỗ trợ cho thanh toán lại`);
            }
        });
    }

    async updateInvoice(invoiceId: number, newStatus: InvoiceStatus): Promise<InvoiceResponseDto> {
        return await this.invoiceRepo.manager.transaction(async transactionalEntityManager => {
            const invoice = await transactionalEntityManager.findOne(Invoice, {
                where: { id: invoiceId },
                relations: ['items'],
            });
            if (!invoice) {
                throw new NotFoundException(`Hóa đơn với ID ${invoiceId} không tồn tại`);
            }
            if (invoice.status === newStatus) {
                throw new BadRequestException(`Hóa đơn đã ở trạng thái ${newStatus}`);
            }

            // Kiểm tra chuyển trạng thái hợp lệ
            const validTransitions = {
                [InvoiceStatus.PENDING]: [InvoiceStatus.CONFIRMED, InvoiceStatus.CANCELLED],
                [InvoiceStatus.CONFIRMED]: [InvoiceStatus.SHIPPING, InvoiceStatus.CANCELLED],
                [InvoiceStatus.SHIPPING]: [InvoiceStatus.DELIVERED, InvoiceStatus.CANCELLED, InvoiceStatus.RETURNED],
                [InvoiceStatus.DELIVERED]: [InvoiceStatus.RETURNED],
                [InvoiceStatus.PAID]: [InvoiceStatus.RETURNED],
                [InvoiceStatus.FAILED]: [InvoiceStatus.CANCELLED, InvoiceStatus.PENDING],
                [InvoiceStatus.CANCELLED]: [],
                [InvoiceStatus.RETURNED]: [],
            };
            if (!validTransitions[invoice.status].includes(newStatus)) {
                throw new BadRequestException(`Không thể chuyển từ ${invoice.status} sang ${newStatus}`);
            }

            // Hoàn lại stock và discount cho CANCELLED hoặc RETURNED
            if (newStatus === InvoiceStatus.CANCELLED || newStatus === InvoiceStatus.RETURNED) {
                const invoiceItems = await transactionalEntityManager.find(InvoiceItem, { where: { invoiceId: invoice.id } });
                const productDetailIds = invoiceItems.map(item => item.productDetailId);
                const productDetails = await transactionalEntityManager.find(ProductDetails, { where: { id: In(productDetailIds) } });
                const productDetailsMap = new Map(productDetails.map(pd => [pd.id, pd]));

                const invoiceDiscounts = await transactionalEntityManager.find(InvoiceDiscount, { where: { invoiceId: invoice.id } });
                const discountIds = invoiceDiscounts.map(id => id.discountId);
                const discountMap = new Map<number, Discount>();
                if (discountIds.length > 0) {
                    const discounts = await transactionalEntityManager.find(Discount, { where: { id: In(discountIds) } });
                    discounts.forEach(discount => discountMap.set(discount.id, discount));
                }

                for (const item of invoiceItems) {
                    const productDetail = productDetailsMap.get(item.productDetailId)!;
                    productDetail.stock += item.quantity;
                    productDetail.sold = Math.max(0, (productDetail.sold || 0) - item.quantity);
                    await transactionalEntityManager.save(ProductDetails, productDetail);
                }

                if (discountIds.length > 0) {
                    for (const discountId of discountIds) {
                        const discount = discountMap.get(discountId)!;
                        discount.quantity += 1;
                        await transactionalEntityManager.save(Discount, discount);
                    }
                }
            }

            // Với COD, DELIVERED tự động cập nhật PAID
            if (newStatus === InvoiceStatus.DELIVERED && invoice.paymentMethod === PaymentMethod.COD && invoice.status !== InvoiceStatus.PAID) {
                invoice.status = InvoiceStatus.PAID;
            } else {
                invoice.status = newStatus;
            }
            invoice.updatedAt = new Date();
            await transactionalEntityManager.save(Invoice, invoice);

            // Gửi thông báo
            await this.notificationService.sendNotification({
                userId: invoice.userId,
                message: `Hóa đơn #${invoiceId} đã được cập nhật thành ${invoice.status}`,
                type: 'INVOICE_UPDATE',
                source: 'ADMIN', // Thông báo từ admin
            });

            this.logger.log(`Invoice ${invoiceId} updated to ${newStatus}`);
            return {
                id: invoice.id,
                userId: invoice.userId,
                addressId: invoice.addressId,
                paymentMethod: invoice.paymentMethod,
                totalProductAmount: invoice.totalProductAmount,
                shippingFee: invoice.shippingFee,
                shippingFeeDiscount: invoice.shippingFeeDiscount,
                productDiscount: invoice.productDiscount,
                finalTotal: invoice.finalTotal,
                status: invoice.status,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
                message: `Hóa đơn đã được cập nhật thành ${newStatus}`,
            };
        });
    }

   
async cancelInvoice(invoiceId: number, userId: string): Promise<InvoiceResponseDto> {
    return await this.invoiceRepo.manager.transaction(async transactionalEntityManager => {
        const invoice = await transactionalEntityManager.findOne(Invoice, {
            where: { id: invoiceId, userId },
            relations: ["items", "user"], // Thêm quan hệ user để lấy username
        });
        if (!invoice) {
            throw new NotFoundException(`Hóa đơn với ID ${invoiceId} không tồn tại hoặc không thuộc về bạn`);
        }
        if (invoice.status !== InvoiceStatus.PENDING && invoice.status !== InvoiceStatus.CONFIRMED) {
            throw new BadRequestException(`Hóa đơn không thể hủy (trạng thái hiện tại: ${invoice.status})`);
        }
        // Kiểm tra thời gian hủy (30 phút)
        const createdAt = new Date(invoice.createdAt);
        const now = new Date();
        const timeDiff = (now.getTime() - createdAt.getTime()) / 1000 / 60; // Phút
        if (timeDiff > 30) {
            throw new BadRequestException("Hóa đơn chỉ có thể hủy trong vòng 30 phút sau khi tạo");
        }

        // Hoàn lại stock và discount cho COD
        if (invoice.paymentMethod === PaymentMethod.COD) {
            const invoiceItems = await transactionalEntityManager.find(InvoiceItem, { where: { invoiceId: invoice.id } });
            const productDetailIds = invoiceItems.map(item => item.productDetailId);
            const productDetails = await transactionalEntityManager.find(ProductDetails, { where: { id: In(productDetailIds) } });
            const productDetailsMap = new Map(productDetails.map(pd => [pd.id, pd]));

            const invoiceDiscounts = await transactionalEntityManager.find(InvoiceDiscount, { where: { invoiceId: invoice.id } });
            const discountIds = invoiceDiscounts.map(id => id.discountId);
            const discountMap = new Map<number, Discount>();
            if (discountIds.length > 0) {
                const discounts = await transactionalEntityManager.find(Discount, { where: { id: In(discountIds) } });
                discounts.forEach(discount => discountMap.set(discount.id, discount));
            }

            for (const item of invoiceItems) {
                const productDetail = productDetailsMap.get(item.productDetailId)!;
                productDetail.stock += item.quantity;
                productDetail.sold = Math.max(0, (productDetail.sold || 0) - item.quantity);
                await transactionalEntityManager.save(ProductDetails, productDetail);
            }

            if (discountIds.length > 0) {
                for (const discountId of discountIds) {
                    const discount = discountMap.get(discountId)!;
                    discount.quantity += 1;
                    await transactionalEntityManager.save(Discount, discount);
                }
            }
            this.logger.log(`Restored stock and discount for COD invoice ${invoiceId}`);
        } else if (invoice.paymentMethod === PaymentMethod.VNPAY) {
            // Với VNPay, không cần hoàn stock/discount vì chưa trừ (trừ khi PAID)
            this.logger.log(`Cancelling VNPay invoice ${invoiceId} in ${invoice.status} status`);
        }

        invoice.status = InvoiceStatus.CANCELLED;
        invoice.updatedAt = new Date();
        await transactionalEntityManager.save(Invoice, invoice);

        // Gửi thông báo cho admin
        try {
            await this.notificationService.sendNotification({
                userId: invoice.userId, // Để backend biết người dùng nào hủy
                message: `Người dùng ${invoice.user.username} đã hủy đơn hàng #${invoiceId} (${invoice.paymentMethod})`,
                type: "INVOICE_CANCELLED",
                source: "USER",
            });
            this.logger.log(`Sent notification for cancelled invoice ${invoiceId}`);
        } catch (error) {
            this.logger.error(`Failed to send notification for invoice ${invoiceId}: ${error}`);
        }

        this.logger.log(`Invoice ${invoiceId} cancelled by user ${userId}`);
        return {
            id: invoice.id,
            userId: invoice.userId,
            addressId: invoice.addressId,
            paymentMethod: invoice.paymentMethod,
            totalProductAmount: invoice.totalProductAmount,
            shippingFee: invoice.shippingFee,
            shippingFeeDiscount: invoice.shippingFeeDiscount,
            productDiscount: invoice.productDiscount,
            finalTotal: invoice.finalTotal,
            status: invoice.status,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
            message: "Hóa đơn đã được hủy thành công",
        };
    });
}}