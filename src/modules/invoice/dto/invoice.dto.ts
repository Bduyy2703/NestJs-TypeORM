import { IsNumber, IsEnum, IsArray, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PaymentMethod } from "../../payment/dto/payment.dto";

export class ProductDetailDto {
  @ApiProperty({ description: "ID của ProductDetails", example: 1 })
  @IsNumber()
  productDetailId: number;

  @ApiProperty({ description: "Số lượng sản phẩm", example: 2 })
  @IsNumber()
  quantity: number;
}

export class AddressDto {
  @ApiProperty({ description: "ID của địa chỉ (nếu có)", example: 1, required: false })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({ description: "Đường", example: "123 Đường Láng, Đống Đa" })
  @IsString()
  street: string;

  @ApiProperty({ description: "Thành phố", example: "Hà Nội" })
  @IsString()
  city: string;

  @ApiProperty({ description: "Quốc gia", example: "Việt Nam" })
  @IsString()
  country: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: "ID của người dùng", example: 1 })
  userId: string;

  @ApiProperty({ description: "Danh sách sản phẩm", type: [ProductDetailDto] })
  @IsArray()
  productDetails: ProductDetailDto[];

  @ApiProperty({ description: "Danh sách ID mã giảm giá", example: [1, 2] })
  discountIds: number[];

  @ApiProperty({ description: "Địa chỉ giao hàng", type: AddressDto })
  address: AddressDto;

  @ApiProperty({ description: "Phương thức thanh toán", example: "PAYPAL", enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: "Tổng tiền sản phẩm", example: 8100000 })
  @IsNumber()
  totalProductAmount: number;

  @ApiProperty({ description: "Phí giao hàng", example: 35000 })
  @IsNumber()
  shippingFee: number;

  @ApiProperty({ description: "Số tiền giảm giá cho phí giao hàng", example: 35000 })
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

  @ApiProperty({ description: "Trạng thái hóa đơn", example: "PAID" })
  status: string;

  @ApiProperty({ description: "Thông báo", example: "Thanh toán thành công" })
  message: string;
}

