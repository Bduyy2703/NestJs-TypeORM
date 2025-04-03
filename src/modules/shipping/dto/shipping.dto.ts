import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

// DTO cho checkoutItems
export class CheckoutItemDto {
  @ApiProperty({ description: "ID sản phẩm", example: 2 })
  @IsNumber()
  productDetailId: number;

  @ApiProperty({ description: "Tên sản phẩm", example: "Nhẫn" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Số lượng", example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: "Giá sản phẩm", example: "900000.00" })
  @IsString()
  price: string;

  @ApiProperty({ description: "Tổng giá sản phẩm", example: 1800000 })
  @IsNumber()
  totalPrice: number;
}

// DTO cho address
export class AddressDto {
  @ApiProperty({ description: "ID địa chỉ (nếu chọn từ danh sách)", example: 2, required: false })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({ description: "Đường", example: "237 Lê Văn Việt" })
  @IsString()
  street: string;

  @ApiProperty({ description: "Thành phố", example: "Hà Nội" })
  @IsString()
  city: string;

  @ApiProperty({ description: "Quốc gia", example: "VN" })
  @IsString()
  country: string;
}

// DTO cho request của calculateShippingFee
export class CalculateShippingFeeDto {
  @ApiProperty({ description: "Danh sách sản phẩm", type: [CheckoutItemDto] })
  @IsArray()
  checkoutItems: CheckoutItemDto[];

  @ApiProperty({ description: "Tổng tiền sản phẩm", example: 8100000 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: "Địa chỉ giao hàng", type: AddressDto })
  @IsObject()
  address: AddressDto;
}

// DTO cho response của calculateShippingFee
export class CalculateShippingFeeResponseDto {
  @ApiProperty({ description: "Thông báo", example: "Tính phí giao hàng thành công" })
  message: string;

  @ApiProperty({ description: "Phí ship", example: 35000 })
  shippingFee: number;

  @ApiProperty({ description: "Tổng tiền sản phẩm", example: 8100000 })
  totalAmount: number;

  @ApiProperty({ description: "Tổng tiền tạm tính", example: 8135000 })
  finalTotal: number;

  @ApiProperty({ description: "Địa chỉ đã chọn", type: AddressDto })
  selectedAddress: AddressDto;
}

// DTO cho request của applyDiscount
export class ApplyDiscountDto {
  @ApiProperty({ description: "Danh sách sản phẩm", type: [CheckoutItemDto] })
  @IsArray()
  checkoutItems: CheckoutItemDto[];

  @ApiProperty({ description: "Tổng tiền sản phẩm", example: 8100000 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: "Phí ship gốc", example: 35000 })
  @IsNumber()
  shippingFee: number;

  @ApiProperty({ description: "Danh sách mã giảm giá", example: ["FREESHIP", "DISCOUNT10"] })
  @IsArray()
  @IsString({ each: true })
  discountCodes: string[];
}

// DTO cho response của applyDiscount
export class ApplyDiscountResponseDto {
  @ApiProperty({ description: "Thông báo", example: "Áp dụng mã giảm giá thành công" })
  message: string;

  @ApiProperty({ description: "Phí ship gốc", example: 35000 })
  shippingFee: number;

  @ApiProperty({ description: "Phí ship sau giảm giá", example: 0 })
  shippingFeeAfterDiscount: number;

  @ApiProperty({ description: "Số tiền giảm giá cho tổng hóa đơn", example: 810000 })
  discountAmount: number;

  @ApiProperty({ description: "Tổng tiền sản phẩm", example: 8100000 })
  totalAmount: number;

  @ApiProperty({ description: "Tổng tiền cuối cùng", example: 7290000 })
  finalTotal: number;
}