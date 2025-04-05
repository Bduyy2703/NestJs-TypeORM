import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsArray, IsEnum } from "class-validator";

export enum PaymentMethod {
  COD = "COD",
  PAYPAL = "PAYPAL",
  VNPAY = "VNPAY",
}

export class OrderItemDto {
  @ApiProperty({ description: "ID của ProductDetails", example: 1 })
  @IsNumber()
  productDetailId: number;

  @ApiProperty({ description: "Số lượng", example: 2 })
  @IsNumber()
  quantity: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: "ID của người dùng", example: 1 })
  @IsNumber()
  userId: string;

  @ApiProperty({ description: "Danh sách sản phẩm", type: [OrderItemDto] })
  @IsArray()
  productDetails: OrderItemDto[];

  @ApiProperty({ description: "Danh sách ID của mã giảm giá", example: [1, 2] })
  @IsArray()
  @IsNumber({}, { each: true })
  discountIds: number[];

  @ApiProperty({ description: "ID của địa chỉ giao hàng", example: 1 })
  @IsNumber()
  addressId: number;

  @ApiProperty({ description: "Phương thức thanh toán", example: "COD", enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: "Tổng tiền sản phẩm trước giảm giá", example: 8100000 })
  @IsNumber()
  totalProductAmount: number;

  @ApiProperty({ description: "Phí giao hàng", example: 35000 })
  @IsNumber()
  shippingFee: number;

  @ApiProperty({ description: "Số tiền giảm giá cho phí ship", example: 35000 })
  @IsNumber()
  shippingFeeDiscount: number;

  @ApiProperty({ description: "Số tiền giảm giá cho sản phẩm", example: 810000 })
  @IsNumber()
  productDiscount: number;

  @ApiProperty({ description: "Tổng tiền cuối cùng", example: 7290000 })
  @IsNumber()
  finalTotal: number;
}

export class InvoiceResponseDto {
  @ApiProperty({ description: "ID của hóa đơn", example: 1 })
  id: number;

  @ApiProperty({ description: "Trạng thái hóa đơn", example: "PENDING" })
  status: string;

  @ApiProperty({ description: "Thông báo", example: "Đơn hàng đã được tạo thành công" })
  message: string;

  @ApiProperty({ description: "URL thanh toán (nếu có)", example: "https://sandbox.vnpayment.vn/...", required: false })
  paymentUrl?: string;
}