import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber } from "class-validator";
import { PaymentMethod } from "./payment.dto"; // Giả sử PaymentMethod đã được định nghĩa trong invoice.dto

export class RetryPaymentDto {
  @ApiProperty({ description: "ID của Invoice", example: 1 })
  @IsNumber()
  invoiceId: number;

  @ApiProperty({ description: "Phương thức thanh toán", example: "PAYPAL", enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}