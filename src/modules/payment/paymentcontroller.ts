import { Controller, Post, Body, Get, Query, Put, ParseIntPipe, Param, Request } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
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
  constructor(private readonly paymentService: PaymentService) { }

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

  @Put('invoice/:invoiceId')
  @Actions('update')
  @Objectcode('PAYMENT01')
  @ApiOperation({ summary: "Cập nhật trạng thái hóa đơn COD" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PAID', 'CANCELLED'],
          example: 'PAID',
        },
      },
      required: ['status'],
    },
  })
  async updateInvoice(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
    @Body('status') status: "PAID" | "CANCELLED"
  ) {
    return this.paymentService.updateInvoice(invoiceId, status);
  }


  @Put(":invoiceId/cancel")
  @Public()
  @ApiOperation({ summary: "Hủy hóa đơn bởi user" })
  @ApiResponse({ status: 200, description: "Hủy hóa đơn thành công", type: InvoiceResponseDto })
  async cancelInvoice(
    @Request() request,
    @Param("invoiceId", ParseIntPipe) invoiceId: number,
  ): Promise<InvoiceResponseDto> {
    const userId = request.user?.userId;; // Giả sử userId lấy từ JWT
    return this.paymentService.cancelInvoice(invoiceId, userId);
  }
}