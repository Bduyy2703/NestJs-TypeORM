import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { CreateInvoiceDto, InvoiceResponseDto } from "./dto/invoice.dto";
import { RetryPaymentDto } from "./dto/retry-payment.dto";
import { PaymentService } from './paymentservice';
import { Objectcode } from "src/cores/decorators/objectcode.decorator";
import { Actions } from "src/cores/decorators/action.decorator";
import { Public } from "src/cores/decorators/public.decorator";

@ApiTags("payment")
@Controller("payment")
@ApiSecurity("JWT-auth") 
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("checkout")
  @Objectcode('PAYMENT01')
  @Actions('execute')
  @ApiOperation({ summary: "Thanh toán đơn hàng" })
  @ApiResponse({
    status: 201,
    description: "Thanh toán thành công",
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: "Dữ liệu đầu vào không hợp lệ" })
  async createInvoice(@Body() body: CreateInvoiceDto) {
    return this.paymentService.createInvoice(body);
  }

  @Post("retry-payment")
  @Objectcode('PAYMENT01')
  @Actions('execute')
  @ApiOperation({ summary: "Thanh toán lại đơn hàng" })
  @ApiResponse({
    status: 200,
    description: "Thanh toán lại thành công",
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: "Dữ liệu đầu vào không hợp lệ" })
  async retryPayment(@Body() body: RetryPaymentDto) {
    const { invoiceId, paymentMethod } = body;
    return this.paymentService.retryPayment(invoiceId, paymentMethod);
  }

  @Get("vnpay-ipn")
@Public()
    @ApiOperation({ summary: "Xử lý callback từ VNPay" })
    @ApiResponse({ status: 200, description: "Callback processed" })
    async handleVnpayIpn(@Query() params: any) {
        return this.paymentService.processVnpayIpn(params);
    }
}