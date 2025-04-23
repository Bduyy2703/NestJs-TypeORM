import { ApiProperty } from "@nestjs/swagger";
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    MinLength,
    ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// Enum cho trạng thái hóa đơn
export enum InvoiceStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    SHIPPING = "SHIPPING",
    DELIVERED = "DELIVERED",
    PAID = "PAID",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    RETURNED = "RETURNED",
}

// Enum cho phương thức thanh toán
export enum PaymentMethod {
    COD = "COD",
    VNPAY = "VNPAY",
    PAYPAL = "PAYPAL",
}

export class UpdateInvoiceStatusDto {
    @ApiProperty({
        description: 'Trạng thái mới của hóa đơn',
        enum: InvoiceStatus,
        example: InvoiceStatus.PAID,
    })
    @IsNotEmpty({ message: 'Trạng thái không được để trống' })
    @IsEnum(InvoiceStatus, { message: 'Trạng thái không hợp lệ' })
    status: InvoiceStatus;
}

// DTO cho thông tin người dùng
export class UserDto {
    @ApiProperty({ description: "ID của người dùng", example: "d7b9af67-e09f-46cd-a18f-d96f84c14979" })
    id: string;

    @ApiProperty({ description: "Tên người dùng", example: "John Doe" })
    username: string;

    @ApiProperty({ description: "Số điện thoại người dùng", example: "0901234567" })
    phoneNumber: string;
}

// DTO cho ProductDetail (dùng trong CreateInvoiceDto)
export class ProductDetailDto {
    @ApiProperty({ description: "ID của ProductDetails", example: 1 })
    @IsNumber({}, { message: "productDetailId phải là số" })
    @Min(1, { message: "productDetailId phải lớn hơn 0" })
    productDetailId: number;

    @ApiProperty({ description: "Số lượng sản phẩm", example: 2 })
    @IsNumber({}, { message: "quantity phải là số" })
    @Min(1, { message: "quantity phải lớn hơn 0" })
    quantity: number;
}

// DTO cho thông tin chi tiết sản phẩm trong response
export class ProductDetailResponseDto {
    @ApiProperty({ description: "ID của ProductDetails", example: 3 })
    productDetailId: number;

    @ApiProperty({ description: "Tên sản phẩm", example: "Sản phẩm A" })
    name: string;

    @ApiProperty({ description: "Giá sản phẩm", example: 360000 })
    price: number;
}

export class DiscountDTO {
    @ApiProperty({ description: "Tên mã giảm giá", example: "SALE2025" })
    @IsString()
    name: string;
  
    @ApiProperty({ description: "Điều kiện áp dụng: SHIPPING (vận chuyển) hoặc TOTAL (tổng tiền)", example: "TOTAL", enum: ["SHIPPING", "TOTAL"] })
    @IsEnum(["SHIPPING", "TOTAL"])
    condition: "SHIPPING" | "TOTAL";
  
    @ApiProperty({ description: "Giá trị giảm", example: 100000 })
    @IsNumber()
    discountValue: number;
  
    @ApiProperty({ description: "Loại giảm giá: PERCENTAGE (theo phần trăm) hoặc FIXED (cố định)", example: "FIXED", enum: ["PERCENTAGE", "FIXED"] })
    @IsEnum(["PERCENTAGE", "FIXED"])
    discountType: "PERCENTAGE" | "FIXED";
  
    @ApiProperty({ description: "Số lượng mã giảm giá", example: 50 })
    @IsNumber()
    quantity: number;
  
    @ApiProperty({ description: "Ngày bắt đầu hiệu lực", example: "2025-04-11T00:00:00.000Z", required: false })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    startDate?: Date;
  
    @ApiProperty({ description: "Ngày kết thúc hiệu lực", example: "2025-05-11T00:00:00.000Z", required: false })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    endDate?: Date;
  }

// DTO cho Address (dùng trong CreateInvoiceDto và InvoiceResponseDto)
export class AddressDto {
    @ApiProperty({ description: "ID của địa chỉ (nếu có)", example: 1, required: false })
    @IsOptional()
    @IsNumber({}, { message: "id phải là số" })
    @Min(1, { message: "id phải lớn hơn 0" })
    id?: number;

    @ApiProperty({ description: "Đường", example: "123 Đường Láng, Đống Đa" })
    @IsString({ message: "street phải là chuỗi" })
    @MinLength(1, { message: "street không được để trống" })
    street: string;

    @ApiProperty({ description: "Thành phố", example: "Hà Nội" })
    @IsString({ message: "city phải là chuỗi" })
    @MinLength(1, { message: "city không được để trống" })
    city: string;

    @ApiProperty({ description: "Quốc gia", example: "Việt Nam" })
    @IsString({ message: "country phải là chuỗi" })
    @MinLength(1, { message: "country không được để trống" })
    country: string;
}

// DTO cho InvoiceItem trong response
export class InvoiceItemResponseDto {
    @ApiProperty({ description: "ID của invoice item", example: 1 })
    id: number;

    @ApiProperty({ description: "ID của ProductDetails", example: 1 })
    productDetailId: number;

    @ApiProperty({ description: "Thông tin sản phẩm", type: ProductDetailResponseDto })
    productDetail: ProductDetailResponseDto | null;

    @ApiProperty({ description: "Số lượng", example: 2 })
    quantity: number;

    @ApiProperty({ description: "Giá đơn vị", example: 4050000 })
    price: number;

    @ApiProperty({ description: "Tổng phụ", example: 8100000 })
    subtotal: number;
}

export class discountitemdto {
    @ApiProperty({ description: "ID của invoice item", example: 1 })
    id: number;

    @ApiProperty({ description: "ID của ProductDetails", example: 1 })
    discountId: number;

    @ApiProperty({ description: "Thông tin mã giảm giá", type: DiscountDTO })
    discount: DiscountDTO | null;

}

// DTO để tạo một invoice
export class CreateInvoiceDto {
    @ApiProperty({ description: "ID của người dùng", example: "d7b9af67-e09f-46cd-a18f-d96f84c14979" })
    @IsString({ message: "userId phải là chuỗi" })
    userId: string;

    @ApiProperty({ description: "Danh sách sản phẩm", type: [ProductDetailDto] })
    @IsArray({ message: "productDetails phải là mảng" })
    @ValidateNested({ each: true })
    @Type(() => ProductDetailDto)
    productDetails: ProductDetailDto[];

    @ApiProperty({ description: "Danh sách ID mã giảm giá", example: [1, 2], required: false })
    @IsOptional()
    @IsArray({ message: "discountIds phải là mảng" })
    @IsNumber({}, { each: true, message: "Mỗi discountId phải là số" })
    @Min(1, { each: true, message: "Mỗi discountId phải lớn hơn 0" })
    discountIds?: number[];

    @ApiProperty({ description: "Địa chỉ giao hàng", type: AddressDto })
    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;

    @ApiProperty({ description: "Phương thức thanh toán", example: "VNPAY", enum: PaymentMethod })
    @IsEnum(PaymentMethod, { message: "paymentMethod không hợp lệ" })
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: "Tổng tiền sản phẩm", example: 8100000 })
    @IsNumber({}, { message: "totalProductAmount phải là số" })
    @Min(0, { message: "totalProductAmount không được nhỏ hơn 0" })
    totalProductAmount: number;

    @ApiProperty({ description: "Phí giao hàng", example: 35000 })
    @IsNumber({}, { message: "shippingFee phải là số" })
    @Min(0, { message: "shippingFee không được nhỏ hơn 0" })
    shippingFee: number;

    @ApiProperty({ description: "Số tiền giảm giá cho phí giao hàng", example: 35000 })
    @IsNumber({}, { message: "shippingFeeDiscount phải là số" })
    @Min(0, { message: "shippingFeeDiscount không được nhỏ hơn 0" })
    shippingFeeDiscount: number;

    @ApiProperty({ description: "Số tiền giảm giá cho sản phẩm", example: 810000 })
    @IsNumber({}, { message: "productDiscount phải là số" })
    @Min(0, { message: "productDiscount không được nhỏ hơn 0" })
    productDiscount: number;

    @ApiProperty({ description: "Tổng tiền cuối cùng", example: 7290000 })
    @IsNumber({}, { message: "finalTotal phải là số" })
    @Min(0, { message: "finalTotal không được nhỏ hơn 0" })
    finalTotal: number;
}

// DTO cho response của invoice
export class InvoiceResponseDto {
    @ApiProperty({ description: "ID của hóa đơn", example: 1 })
    id: number;

    @ApiProperty({ description: "ID của người dùng", example: "d7b9af67-e09f-46cd-a18f-d96f84c14979" })
    userId: string;

    @ApiProperty({ description: "Thông tin người dùng", type: UserDto })
    user: UserDto;

    @ApiProperty({ description: "ID của địa chỉ", example: 1 })
    addressId: number;

    @ApiProperty({ description: "Địa chỉ giao hàng", type: AddressDto })
    address: AddressDto;

    @ApiProperty({ description: "Phương thức thanh toán", example: "VNPAY", enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: "Tổng tiền sản phẩm", example: 8100000 })
    totalProductAmount: number;

    @ApiProperty({ description: "Phí giao hàng", example: 35000 })
    shippingFee: number;

    @ApiProperty({ description: "Số tiền giảm giá cho phí giao hàng", example: 35000 })
    shippingFeeDiscount: number;

    @ApiProperty({ description: "Số tiền giảm giá cho sản phẩm", example: 810000 })
    productDiscount: number;

    @ApiProperty({ description: "Tổng tiền cuối cùng", example: 7290000 })
    finalTotal: number;

    @ApiProperty({ description: "Trạng thái hóa đơn", example: "PAID", enum: InvoiceStatus })
    status: InvoiceStatus;

    @ApiProperty({ description: "Ngày tạo", example: "2025-04-05T10:00:00.000Z" })
    createdAt: Date;

    @ApiProperty({ description: "Ngày cập nhật", example: "2025-04-05T10:00:00.000Z" })
    updatedAt: Date;

    @ApiProperty({ description: "Danh sách sản phẩm trong hóa đơn", type: [InvoiceItemResponseDto] })
    items: InvoiceItemResponseDto[];
    @ApiProperty({ description: "Danh sách mã giảm giá trong hóa đơn", type: [InvoiceItemResponseDto] })
    discount: discountitemdto[];
}

// DTO cho thống kê doanh thu
export class RevenueStatisticsDto {
    @ApiProperty({ description: "Tổng doanh thu", example: 15000000 })
    totalRevenue: number;

    @ApiProperty({ description: "Tổng số hóa đơn", example: 50 })
    totalInvoices: number;

    @ApiProperty({ description: "Ngày bắt đầu", example: "2025-01-01" })
    startDate: string;

    @ApiProperty({ description: "Ngày kết thúc", example: "2025-12-31" })
    endDate: string;
}

// DTO cho thống kê số lượng hóa đơn theo trạng thái
export class StatusCountDto {
    @ApiProperty({ description: "Trạng thái hóa đơn", example: "PAID", enum: InvoiceStatus })
    status: InvoiceStatus;

    @ApiProperty({ description: "Số lượng hóa đơn", example: 30 })
    count: number;
}

export class StatusStatisticsDto {
    @ApiProperty({ description: "Ngày bắt đầu", example: "2025-01-01" })
    startDate: string;

    @ApiProperty({ description: "Ngày kết thúc", example: "2025-12-31" })
    endDate: string;

    @ApiProperty({ description: "Thống kê theo trạng thái", type: [StatusCountDto] })
    statistics: StatusCountDto[];
}

// DTO cho thống kê sản phẩm bán chạy
export class TopProductStatisticsDto {
    @ApiProperty({ description: "ID của ProductDetails", example: 1 })
    productDetailId: number;

    @ApiProperty({ description: "Tên sản phẩm", example: "Sản phẩm A" })
    productName: string;

    @ApiProperty({ description: "Tổng số lượng bán ra", example: 100 })
    totalQuantity: number;

    @ApiProperty({ description: "Tổng doanh thu từ sản phẩm", example: 5000000 })
    totalRevenue: number;
}

// DTO cho thống kê khách hàng chi tiêu nhiều nhất
export class TopCustomerStatisticsDto {
    @ApiProperty({ description: "ID của người dùng", example: "d7b9af67-e09f-46cd-a18f-d96f84c14979" })
    userId: string;

    @ApiProperty({ description: "Tên người dùng", example: "nguyenvana" })
    username: string;

    @ApiProperty({ description: "Tổng số tiền chi tiêu", example: 10000000 })
    totalSpent: number;

    @ApiProperty({ description: "Tổng số hóa đơn", example: 20 })
    totalInvoices: number;
}

// DTO cho thống kê doanh thu theo phương thức thanh toán
export class PaymentMethodStatisticsDto {
    @ApiProperty({ description: "Phương thức thanh toán", example: "VNPAY", enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: "Tổng doanh thu", example: 8000000 })
    totalRevenue: number;

    @ApiProperty({ description: "Tổng số hóa đơn", example: 30 })
    totalInvoices: number;
}

// DTO cho thống kê số lượng hóa đơn theo ngày/tháng
export class InvoiceCountStatisticsDto {
    @ApiProperty({ description: "Thời gian (ngày hoặc tháng)", example: "2025-01-01" })
    period: string; // Ngày (YYYY-MM-DD) hoặc tháng (1-12)

    @ApiProperty({ description: "Số lượng hóa đơn", example: 15 })
    count: number;
}