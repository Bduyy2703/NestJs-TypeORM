import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as crypto from "crypto";
import * as querystring from "qs";
import { Invoice } from "../../invoice/entity/invoice.entity";

@Injectable()
export class VnpayService {
    private readonly logger = new Logger(VnpayService.name);
    private readonly vnp_TmnCode = process.env.VNP_TMNCODE;
    private readonly vnp_HashSecret = process.env.VNP_HASHSECRET;
    private readonly vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private readonly vnp_ReturnUrl = "http://localhost:3000/api/v1/payment/vnpay-ipn"; // Cần thay đổi theo môi trường thực tế

    constructor(
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>
    ) {}

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

    async processVnpayIpn(params: any): Promise<{ rspCode: string; message: string; invoice: Invoice }> {
        const { secureHash, signed, vnp_Params } = this.signedParams(params);

        // Kiểm tra tính hợp lệ của mã hash
        if (secureHash !== signed) {
            this.logger.error('Invalid hash in VNPay IPN');
            return { rspCode: '97', message: 'Mã hash không hợp lệ', invoice: null };
        }

        const rspCode = vnp_Params['vnp_ResponseCode'];
        const orderId = vnp_Params['vnp_OrderInfo'];
        const amount = parseFloat(vnp_Params['vnp_Amount']) / 100;

        const invoice = await this.invoiceRepo.findOne({ where: { id: parseInt(orderId) } });
        if (!invoice) {
            this.logger.error(`Invoice ${orderId} not found in VNPay IPN`);
            return { rspCode: '01', message: 'Hóa đơn không tồn tại', invoice: null };
        }

        // Kiểm tra số tiền
        if (amount !== invoice.finalTotal) {
            this.logger.error(`Amount mismatch in VNPay IPN for invoice ${orderId}`);
            return { rspCode: '04', message: 'Số tiền không khớp', invoice };
        }

        let message = '';
        switch (rspCode) {
            case '00': // Thanh toán thành công
                message = "Thanh toán thành công";
                invoice.status = "PAID";
                break;
            case '24': // Giao dịch đã bị hủy
                message = "Giao dịch đã bị hủy";
                invoice.status = "CANCELLED";
                break;
            case '01': // Giao dịch đang chờ xử lý
                message = "Giao dịch đang chờ xử lý";
                invoice.status = "PENDING";
                break;
            default: // Các trường hợp khác
                message = "Thanh toán thất bại";
                invoice.status = "FAILED";
                break;
        }

        invoice.updatedAt = new Date();
        await this.invoiceRepo.save(invoice);
        this.logger.log(`Invoice ${orderId} updated to status ${invoice.status} via VNPay IPN`);

        return { rspCode, message, invoice };
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