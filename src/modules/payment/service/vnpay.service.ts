import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import * as crypto from "crypto";
import * as querystring from "qs";
import { Invoice } from "../../invoice/entity/invoice.entity";
import { InvoiceItem } from "src/modules/invoice/entity/invoiceItem.entity";
import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";
import { InvoiceDiscount } from "src/modules/invoice/entity/invoice-discount.entity";
import { Discount } from "src/modules/discount/entity/discount.entity";
import { NotificationService } from "src/modules/notification/notify.service";
import { User } from "src/modules/users/entities/user.entity";

@Injectable()
export class VnpayService {
    private readonly logger = new Logger(VnpayService.name);
    private readonly vnp_TmnCode = process.env.VNP_TMNCODE;
    private readonly vnp_HashSecret = process.env.VNP_HASHSECRET;
    private readonly vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private readonly vnp_ReturnUrl = "https://www.dclux.store/api/v1/payment/vnpay-ipn"; // Cần thay đổi theo môi trường thực tế "http://35.247.185.8/api/v1/payment/vnpay-ipn"
    private readonly frontendSuccessUrl = "https://dclux-store.vercel.app/payment-success";
    // private readonly frontendSuccessUrl = "http://localhost:3000/payment-success";
    private readonly frontendFailUrl = "http://localhost:3000/payment-fail"
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>,
        private readonly notificationService: NotificationService,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async processVnpayPayment(invoice: Invoice, amount: number): Promise<string> {
        const date = new Date();
        const createDate = date.toISOString().replace(/[^0-9]/g, '').slice(0, 14); // Format: yyyymmddHHMMss

        let vnp_Params: { [key: string]: string | number } = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = this.vnp_TmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = `${invoice.id}_${Date.now()}`; // Đảm bảo không trùng lặp
        vnp_Params['vnp_OrderInfo'] = invoice.id.toString();
        vnp_Params['vnp_OrderType'] = 'billpayment';
        vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu nhân 100
        vnp_Params['vnp_ReturnUrl'] = this.vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = '127.0.0.1'; // Nên lấy từ request trong thực tế
        vnp_Params['vnp_CreateDate'] = createDate;

        vnp_Params = this.sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        vnp_Params['vnp_SecureHash'] = signed;

        const vnpUrl = this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
        this.logger.log(`Generated VNPay payment URL for invoice ${invoice.id}: ${vnpUrl}`);
        return vnpUrl;
    }

    async processVnpayIpn(params: any): Promise<{ rspCode: string; message: string; invoice: Invoice | null; redirectUrl: string | null }> {
        const { secureHash, signed, vnp_Params } = this.signedParams(params);

        if (secureHash !== signed) {
            this.logger.error('Invalid hash in VNPay IPN');
            return { rspCode: '97', message: 'Mã hash không hợp lệ', invoice: null, redirectUrl: null };
        }

        const rspCode = vnp_Params['vnp_ResponseCode'];
        const orderId = vnp_Params['vnp_OrderInfo'];
        const amount = parseFloat(vnp_Params['vnp_Amount']) / 100;

        this.logger.log(`vnp_Params: ${JSON.stringify(vnp_Params)}`);
        this.logger.log(`orderId: ${orderId}, type: ${typeof orderId}`);

        if (!orderId) {
            this.logger.error('Missing orderId in VNPay IPN');
            return { rspCode: '99', message: 'Thiếu thông tin hóa đơn', invoice: null, redirectUrl: null };
        }

        const idinvoice = parseInt(orderId);
        this.logger.log(`idinvoice: ${idinvoice}, type: ${typeof idinvoice}`);

        let invoice = await this.invoiceRepo.findOne({ where: { id: idinvoice }, relations: ["items", "user"] });
        if (!invoice) {
            this.logger.error(`Invoice ${orderId} not found in VNPay IPN`);
            return { rspCode: '01', message: 'Hóa đơn không tồn tại', invoice: null, redirectUrl: null };
        }

        if (invoice.status === 'PAID') {
            this.logger.warn(`Invoice ${orderId} already processed (status: PAID)`);
            return {
                rspCode: '02',
                message: 'Hóa đơn đã được xử lý trước đó',
                invoice,
                redirectUrl: `${this.frontendSuccessUrl}?invoiceId=${invoice.id}`
            };
        }

        if (amount !== invoice.finalTotal) {
            this.logger.error(`Amount mismatch in VNPay IPN for invoice ${orderId}. Expected: ${invoice.finalTotal}, Received: ${amount}`);
            return { rspCode: '04', message: 'Số tiền không khớp', invoice, redirectUrl: null };
        }
        // Nếu không có user trong invoice, truy vấn bổ sung từ userRepo
        let username = invoice.user?.username;
        if (!username) {
            const user = await this.userRepo.findOne({ where: { id: invoice.userId } });
            username = user?.username || "Unknown";
        }

        this.logger.log(`Amount mismatch in VNPay IPN  code neeee: ${rspCode}`);
        return await this.invoiceRepo.manager.transaction(async transactionalEntityManager => {
            let message = '';
            let redirectUrl: string | null = null;
            let notificationMessage = "";
            switch (rspCode) {
                case '00':
                    // Thanh toán thành công
                    message = "Thanh toán thành công";
                    invoice.status = "PAID";
                    redirectUrl = `${this.frontendSuccessUrl}?invoiceId=${invoice.id}`;
                    notificationMessage = `Người dùng ${invoice.userId} đã thanh toán thành công đơn hàng #${invoice.id} qua VNPay`;
                    // Lấy thông tin sản phẩm và discount
                    const invoiceItems = await transactionalEntityManager.find(InvoiceItem, { where: { invoiceId: invoice.id } });
                    const productDetailIds = invoiceItems.map(item => item.productDetailId);
                    const productDetails = await transactionalEntityManager.find(ProductDetails, { where: { id: In(productDetailIds) } });
                    const productDetailsMap = new Map(productDetails.map(pd => [pd.id, pd]));
                    console.log('invoiceId', invoice.id, typeof invoice.id)
                    const invoiceDiscounts = await transactionalEntityManager.find(InvoiceDiscount, { where: { invoiceId: invoice.id } });
                    console.log('invoiceDiscounts', invoiceDiscounts)

                    const discountIds = invoiceDiscounts.map(id => id.discountId);
                    console.log('discountIds', discountIds)
                    const discountMap = new Map<number, Discount>();
                    if (discountIds.length > 0) {
                        const discounts = await transactionalEntityManager.find(Discount, { where: { id: In(discountIds) } });
                        discounts.forEach(discount => discountMap.set(discount.id, discount));
                    }

                    // Trừ stock và tăng sold
                    for (const item of invoiceItems) {
                        const productDetail = productDetailsMap.get(item.productDetailId)!;
                        if (productDetail.stock < item.quantity) {
                            throw new BadRequestException(`Sản phẩm với ID ${item.productDetailId} không đủ tồn kho khi thanh toán`);
                        }
                        productDetail.stock -= item.quantity;
                        productDetail.sold = (productDetail.sold || 0) + item.quantity;
                        await transactionalEntityManager.save(ProductDetails, productDetail);
                    }

                    // Trừ discount.quantity
                    if (discountIds.length > 0) {
                        console.log('invoiceDiscounts sub', invoiceDiscounts)
                        for (const discountId of discountIds) {
                            const discount = discountMap.get(discountId)!;
                            if (discount.quantity <= 0) {
                                throw new BadRequestException(`Mã giảm giá với ID ${discountId} đã hết số lượng khi thanh toán`);
                            }
                            discount.quantity -= 1;
                            await transactionalEntityManager.save(Discount, discount);
                        }
                    }
                    break;

                case '24':
                    // Giao dịch bị hủy
                    message = "Giao dịch đã bị hủy";
                    invoice.status = "PENDING";
                    redirectUrl = this.frontendFailUrl;
                    notificationMessage = `Người dùng ${invoice.userId} đã hủy thanh toán đơn hàng #${invoice.id} qua VNPay`;
                    break;

                case '01':
                    // Giao dịch đang chờ xử lý
                    message = "Giao dịch đang chờ xử lý";
                    invoice.status = "PENDING";
                    redirectUrl = this.frontendFailUrl;
                    notificationMessage = `Thanh toán đơn hàng #${invoice.id} của người dùng ${invoice.userId} đang chờ xử lý qua VNPay`;
                    break;

                default:
                    // Thanh toán thất bại
                    message = "Thanh toán thất bại";
                    invoice.status = "FAILED";
                    redirectUrl = this.frontendFailUrl;
                    notificationMessage = `Thanh toán đơn hàng #${invoice.id} của người dùng ${invoice.userId} thất bại qua VNPay (mã lỗi: ${rspCode})`;
                    break;
            }

            invoice.updatedAt = new Date();
            await transactionalEntityManager.save(Invoice, invoice);
            this.logger.log(`Invoice ${orderId} updated to status ${invoice.status} via VNPay IPN`);
            try {
                await this.notificationService.sendNotification({
                    userId: invoice.userId, // Để backend biết người dùng nào thực hiện
                    message: notificationMessage,
                    type: "INVOICE_PAYMENT",
                    source: "USER",
                });
                this.logger.log(`Sent payment notification for invoice ${invoice.id}: ${notificationMessage}`);
            } catch (error) {
                this.logger.error(`Failed to send payment notification for invoice ${invoice.id}: ${error}`);
            }

            return { rspCode, message, invoice, redirectUrl };
        });
    }

    private sortObject(obj: { [key: string]: any }): { [key: string]: any } {
        const sorted: { [key: string]: any } = {};
        const keys = Object.keys(obj).sort();
        for (const key of keys) {
            sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
        }
        return sorted;
    }

    private signedParams(params: any): { secureHash: string; signed: string; vnp_Params: any } {
        const secureHash = params['vnp_SecureHash'];
        delete params['vnp_SecureHash'];
        delete params['vnp_SecureHashType'];

        const vnp_Params = this.sortObject(params);
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        return { secureHash, signed, vnp_Params };
    }
}