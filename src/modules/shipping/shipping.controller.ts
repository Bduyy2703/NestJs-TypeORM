import { Controller, Post, Body } from "@nestjs/common";
import { ShippingService } from "./shipping.service";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";
import { Actions } from "src/cores/decorators/action.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBody,
} from "@nestjs/swagger";
import {
  CalculateShippingFeeDto,
  CalculateShippingFeeResponseDto,
  ApplyDiscountDto,
  ApplyDiscountResponseDto,
  AvailableDiscountDto,
  AvailableDiscountResponseDto,
} from "./dto/shipping.dto";

@ApiTags("Shipping") // Tag cho Swagger
@ApiSecurity("JWT-auth") // Yêu cầu JWT authentication
@Controller("shipping")
export class ShippingController {
  constructor(private shippingService: ShippingService) { }

  @Post("calculate")
  @Objectcode("SHIP01")
  @Actions("execute")
  @ApiOperation({ summary: "Tính phí giao hàng dựa trên địa chỉ" })
  @ApiBody({ type: CalculateShippingFeeDto })
  @ApiResponse({
    status: 201,
    description: "Tính phí giao hàng thành công",
    type: CalculateShippingFeeResponseDto,
  })
  @ApiResponse({ status: 400, description: "Dữ liệu đầu vào không hợp lệ" })
  async calculateShippingFee(@Body() body: CalculateShippingFeeDto) {
    const { checkoutItems, totalAmount, address } = body;
    return this.shippingService.calculateShippingFee(
      checkoutItems,
      totalAmount,
      address
    );
  }

  @Post("apply-discount")
  @Objectcode("SHIP01")
  @Actions("execute")
  @ApiOperation({ summary: "Áp dụng mã giảm giá cho đơn hàng" })
  @ApiBody({ type: ApplyDiscountDto })
  @ApiResponse({
    status: 201,
    description: "Áp dụng mã giảm giá thành công",
    type: ApplyDiscountResponseDto,
  })
  @ApiResponse({ status: 400, description: "Mã giảm giá không hợp lệ" })
  async applyDiscount(@Body() body: ApplyDiscountDto) {
    const { totalAmount, shippingFee, discountCodes } = body;
    return this.shippingService.applyDiscount(
      totalAmount,
      shippingFee,
      discountCodes
    );
  }

  @Post("available-discounts")
  @Objectcode("SHIP01")
  @Actions("execute")
  @ApiOperation({ summary: "Lấy danh sách mã giảm giá áp dụng được" })
  @ApiBody({ type: AvailableDiscountDto })
  @ApiResponse({
    status: 200,
    description: "Danh sách mã giảm giá hợp lệ",
    type: [AvailableDiscountResponseDto],
  })
  async getAvailableDiscounts(@Body() body: AvailableDiscountDto) {
    const { totalAmount, shippingFee } = body;
    return this.shippingService.getAvailableDiscounts(totalAmount, shippingFee);
  }
  
}