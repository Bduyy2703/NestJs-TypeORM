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
} from "./dto/shipping.dto";

@ApiTags("Shipping") // Tag cho Swagger
@ApiSecurity("JWT-auth") // Yêu cầu JWT authentication
@Controller("shipping")
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post("calculate")
  @Objectcode("SHIP01")
  @Actions("create")
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
  @Actions("create")
  @ApiOperation({ summary: "Áp dụng mã giảm giá cho đơn hàng" })
  @ApiBody({ type: ApplyDiscountDto })
  @ApiResponse({
    status: 201,
    description: "Áp dụng mã giảm giá thành công",
    type: ApplyDiscountResponseDto,
  })
  @ApiResponse({ status: 400, description: "Mã giảm giá không hợp lệ" })
  async applyDiscount(@Body() body: ApplyDiscountDto) {
    const { checkoutItems, totalAmount, shippingFee, discountCodes } = body;
    return this.shippingService.applyDiscount(
      checkoutItems,
      totalAmount,
      shippingFee,
      discountCodes
    );
  }
}