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
    private readonly frontendSuccessUrl = "http://localhost:3000/payment-success";
    private readonly frontendFailUrl = "http://localhost:3000/payment-fail"
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>
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
    
        let invoice = await this.invoiceRepo.findOne({ where: { id: idinvoice } });
        this.logger.log(`Invoice (findOne): ${JSON.stringify(invoice)}`);
    
        if (!invoice) {
            this.logger.log(`Trying to find invoice with createQueryBuilder...`);
            invoice = await this.invoiceRepo
                .createQueryBuilder('invoice')
                .where('invoice.id = :id', { id: idinvoice })
                .getOne();
            this.logger.log(`Invoice (createQueryBuilder): ${JSON.stringify(invoice)}`);
        }
    
        // Thử raw query
        if (!invoice) {
            this.logger.log(`Trying raw query...`);
            const rawResult = await this.invoiceRepo.query(`SELECT * FROM invoice WHERE id = $1`, [idinvoice]);
            this.logger.log(`Raw query result: ${JSON.stringify(rawResult)}`);
            if (rawResult && rawResult.length > 0) {
                invoice = rawResult[0]; // Cần ánh xạ thủ công nếu cần
            }
        }
    
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
    
        let message = '';
        let redirectUrl: string | null = null;
        switch (rspCode) {
            case '00':
                message = "Thanh toán thành công";
                invoice.status = "PAID";
                redirectUrl = `${this.frontendSuccessUrl}?invoiceId=${invoice.id}`;
                break;
            case '24':
                message = "Giao dịch đã bị hủy";
                invoice.status = "CANCELLED";
                redirectUrl = this.frontendFailUrl;
                break;
            case '01':
                message = "Giao dịch đang chờ xử lý";
                invoice.status = "PENDING";
                redirectUrl = this.frontendFailUrl;
                break;
            default:
                message = "Thanh toán thất bại";
                invoice.status = "FAILED";
                redirectUrl = this.frontendFailUrl;
                break;
        }
    
        invoice.updatedAt = new Date();
        await this.invoiceRepo.save(invoice);
        this.logger.log(`Invoice ${orderId} updated to status ${invoice.status} via VNPay IPN`);
    
        return { rspCode, message, invoice, redirectUrl };
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