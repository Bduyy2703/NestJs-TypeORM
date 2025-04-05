import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Discount } from "../discount/entity/discount.entity";
import { ProductDetails } from "../product-details/entity/productDetail.entity";
import { Address } from "../address/entity/address.entity";
import { User } from "../users/entities/user.entity";
import { Invoice } from "../invoice/entity/invoice.entity";
import { InvoiceItem } from "../invoice/entity/invoiceItem.entity";
import { CreateInvoiceDto, InvoiceResponseDto } from "../invoice/dto/invoice.dto";
import { VnpayService } from "./service/vnpay.service";
import { PaymentMethod } from "./dto/payment.dto";
import { CartService } from "../cart/cart.service";

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
        private readonly cartService: CartService
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

            // 3. Kiểm tra productDetails
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

            if (discountIds && discountIds.length > 0) {
                // Trường hợp có discountIds: Thực hiện logic tính toán giảm giá như cũ
                let shippingDiscountApplied = false;
                let totalDiscountApplied = false;

                const discounts = await transactionalEntityManager.find(Discount, {
                    where: { id: In(discountIds), isActive: true },
                });
                const discountMap = new Map(discounts.map(d => [d.id, d]));

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

                    let appliedDiscountValue = 0;
                    if (discount.discountType === "FIXED") {
                        appliedDiscountValue = discountValue;
                    } else if (discount.discountType === "PERCENTAGE") {
                        appliedDiscountValue =
                            discount.condition === "SHIPPING"
                                ? (shippingFee * discountValue) / 100
                                : (totalProductAmount * discountValue) / 100;

                        if (isNaN(appliedDiscountValue)) {
                            throw new BadRequestException(`Không thể tính giá trị giảm giá cho mã ${discountId}: dữ liệu không hợp lệ`);
                        }

                        // Đảm bảo giá trị giảm giá không vượt quá tổng tiền (tránh giá trị âm)
                        if (discount.condition === "SHIPPING" && appliedDiscountValue > shippingFee) {
                            appliedDiscountValue = shippingFee;
                        } else if (discount.condition === "TOTAL" && appliedDiscountValue > totalProductAmount) {
                            appliedDiscountValue = totalProductAmount;
                        }
                    }

                    if (discount.condition === "SHIPPING") {
                        if (shippingDiscountApplied) {
                            throw new BadRequestException(`Đã áp dụng mã giảm giá cho phí ship, không thể áp dụng thêm mã ${discountId}`);
                        }
                        calculatedShippingFeeDiscount = appliedDiscountValue;
                        shippingDiscountApplied = true;
                    } else if (discount.condition === "TOTAL") {
                        if (totalDiscountApplied) {
                            throw new BadRequestException(`Đã áp dụng mã giảm giá cho tổng tiền, không thể áp dụng thêm mã ${discountId}`);
                        }
                        calculatedProductDiscount = appliedDiscountValue;
                        totalDiscountApplied = true;
                    }
                }

                // So sánh giá trị giảm giá tính toán được với giá trị từ DTO
                const parsedCalculatedShippingFeeDiscount = parseInt(calculatedShippingFeeDiscount.toString());
                const parsedCalculatedProductDiscount = parseInt(calculatedProductDiscount.toString());

                if (parsedCalculatedShippingFeeDiscount !== shippingFeeDiscount) {
                    throw new BadRequestException(`Số tiền giảm giá cho phí ship không khớp: tính được ${parsedCalculatedShippingFeeDiscount}, nhưng nhận được ${shippingFeeDiscount}`);
                }
                if (parsedCalculatedProductDiscount !== productDiscount) {
                    throw new BadRequestException(`Số tiền giảm giá cho sản phẩm không khớp: tính được ${parsedCalculatedProductDiscount}, nhưng nhận được ${productDiscount}`);
                }

                // 5. Giảm số lượng mã giảm giá
                for (const discountId of discountIds) {
                    const discount = discountMap.get(discountId)!;
                    discount.quantity -= 1;
                    await transactionalEntityManager.save(Discount, discount);
                }
            } else {
                // Trường hợp không có discountIds: Đặt giá trị giảm giá mặc định là 0 và kiểm tra DTO
                calculatedShippingFeeDiscount = 0;
                calculatedProductDiscount = 0;

                if (shippingFeeDiscount !== 0) {
                    throw new BadRequestException(`Không có mã giảm giá, nhưng số tiền giảm giá cho phí ship được gửi lên là ${shippingFeeDiscount}. Phải là 0.`);
                }
                if (productDiscount !== 0) {
                    throw new BadRequestException(`Không có mã giảm giá, nhưng số tiền giảm giá cho sản phẩm được gửi lên là ${productDiscount}. Phải là 0.`);
                }
            }

            // 6. Kiểm tra tổng tiền cuối cùng
            const calculatedFinalTotal = (totalProductAmount - productDiscount) + (shippingFee - shippingFeeDiscount);
            const parsedCalculatedFinalTotal = parseInt(calculatedFinalTotal.toString());
            const parsedFinalTotal = parseInt(finalTotal.toString());

            if (parsedCalculatedFinalTotal !== parsedFinalTotal) {
                throw new BadRequestException(`Tổng tiền cuối cùng không khớp: tính được ${parsedCalculatedFinalTotal}, nhưng nhận được ${parsedFinalTotal}`);
            }
            // 5. Giảm số lượng sản phẩm và tăng số lượng đã bán
            for (const item of productDetails) {
                const productDetail = productDetailsMap.get(item.productDetailId)!;
                productDetail.stock -= item.quantity;
                productDetail.sold += item.quantity;
                await transactionalEntityManager.save(ProductDetails, productDetail);
            }

            // 7. Tạo và lưu Invoice
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

            // 8. Gán invoiceId và lưu InvoiceItem
            invoiceItems.forEach(item => {
                item.invoiceId = invoice.id;
                item.price = parseInt(item.price.toString());
            });
            await transactionalEntityManager.save(InvoiceItem, invoiceItems);
            // 9. Xóa các sản phẩm trong giỏ hàng của người dùng
            for (const item of productDetails) {
                const cartItem = await this.cartService.findCartItemByProductDetailId(userId, item.productDetailId);
                if (cartItem) {
                    await this.cartService.removeCartItem(cartItem.id);
                    this.logger.log(`Removed cart item with ID ${cartItem.id} for user ${userId}`);
                }
            }
            // 9. Xử lý thanh toán
            if (paymentMethod === PaymentMethod.COD) {
                this.logger.log(`Invoice ${invoice.id} created successfully with COD`);
                return {
                    id: invoice.id,
                    status: invoice.status,
                    message: "Đơn hàng đã được tạo thành công (COD)",
                };
            } else if (paymentMethod === PaymentMethod.VNPAY) {
                const paymentUrl = await this.vnpayService.processVnpayPayment(invoice, finalTotal);
                this.logger.log(`Invoice ${invoice.id} created, redirecting to VNPay: ${paymentUrl}`);
                return {
                    id: invoice.id,
                    status: invoice.status,
                    message: "Đang chuyển hướng đến VNPay để thanh toán",
                    paymentUrl,
                };
            } else {
                throw new BadRequestException(`Phương thức thanh toán ${paymentMethod} không được hỗ trợ`);
            }
        });
    }

    async processVnpayIpn(params: any): Promise<{ rspCode: string; message: string; invoice: Invoice }> {
        return this.vnpayService.processVnpayIpn(params);
    }

    async retryPayment(invoiceId: number, paymentMethod: PaymentMethod): Promise<InvoiceResponseDto> {
        return await this.invoiceRepo.manager.transaction(async transactionalEntityManager => {
            // 1. Kiểm tra invoice
            const invoice = await transactionalEntityManager.findOne(Invoice, { where: { id: invoiceId } });
            if (!invoice) {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} không tồn tại`);
            }

            // 2. Kiểm tra trạng thái đơn hàng
            if (invoice.status === "PAID") {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} đã được thanh toán thành công`);
            }
            if (invoice.status === "CANCELLED") {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} đã bị hủy, không thể thanh toán lại`);
            }
            if (invoice.paymentMethod === PaymentMethod.COD) {
                throw new BadRequestException(`Đơn hàng với ID ${invoiceId} sử dụng phương thức COD, không thể thanh toán lại`);
            }

            // 3. Kiểm tra lại số lượng tồn kho
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
                    throw new BadRequestException(`Sản phẩm với ID ${item.productDetailId} không đủ số lượng tồn kho`);
                }
            }

            // 4. Thực hiện thanh toán lại
            if (paymentMethod === PaymentMethod.VNPAY) {
                const paymentUrl = await this.vnpayService.processVnpayPayment(invoice, invoice.finalTotal);
                this.logger.log(`Retry payment for invoice ${invoice.id}, redirecting to VNPay: ${paymentUrl}`);
                return {
                    id: invoice.id,
                    status: invoice.status,
                    message: "Đang chuyển hướng đến VNPay để thanh toán lại",
                    paymentUrl,
                };
            } else {
                throw new BadRequestException(`Phương thức thanh toán ${paymentMethod} không được hỗ trợ cho thanh toán lại`);
            }
        });
    }
}