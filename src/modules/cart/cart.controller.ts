import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, BadRequestException } from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/Add-to-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cartItem.dto";
import { Request } from "express";
import { User } from "src/modules/users/entities/user.entity";
import { ApiSecurity, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { Actions } from "src/cores/decorators/action.decorator";
import { Objectcode } from "src/cores/decorators/objectcode.decorator";

@Controller("cart")
@ApiTags("Cart")
@ApiBearerAuth()
@ApiSecurity("JWT-auth")
export class CartController {
  constructor(private readonly cartService: CartService) { }

  // Lấy giỏ hàng của user hiện tại
  @Get()
  @Actions('read')
  @Objectcode('CART01')
  @ApiOperation({ summary: "Lấy giỏ hàng của người dùng" })
  @ApiResponse({ status: 200, description: "Danh sách sản phẩm trong giỏ hàng" })
  async getCart(@Req() req: Request) {
    const userId = (req.user as any).userId
    return this.cartService.getCart(userId);
  }

  // Thêm sản phẩm vào giỏ hàng
  @Post('/create')
  @Actions('create')
  @Objectcode('CART01')
  @ApiOperation({ summary: "Thêm sản phẩm vào giỏ hàng" })
  @ApiResponse({ status: 201, description: "Sản phẩm đã được thêm vào giỏ hàng" })
  async addToCart(@Req() req: Request, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart((req.user as any).userId, dto);
  }

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  @Patch(":cartItemId")
  @Actions('update')
  @Objectcode('CART01')
  @ApiOperation({ summary: "Cập nhật số lượng sản phẩm trong giỏ hàng" })
  @ApiResponse({ status: 200, description: "Số lượng sản phẩm đã được cập nhật" })
  async updateCartItem(@Param("cartItemId") cartItemId: number, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateCartItem(cartItemId, dto);
  }

  // Xóa sản phẩm khỏi giỏ hàng
  @Delete(":cartItemId")
  @Actions('delete')
  @Objectcode('CART01')
  @ApiOperation({ summary: "Xóa sản phẩm khỏi giỏ hàng" })
  @ApiResponse({ status: 200, description: "Sản phẩm đã được xóa khỏi giỏ hàng" })
  async removeCartItem(@Param("cartItemId") cartItemId: number) {
    return this.cartService.removeCartItem(cartItemId);
  }

  // Xóa toàn bộ giỏ hàng
  @Delete()
  @Actions('delete')
  @Objectcode('CART01')
  @ApiOperation({ summary: "Xóa toàn bộ giỏ hàng" })
  @ApiResponse({ status: 200, description: "Đã xóa toàn bộ giỏ hàng" })
  async clearCart(@Req() req: Request) {
    return this.cartService.clearCart(req.user as User);
  }



  @Post("checkout")
  @Actions("create")
  @Objectcode("CART01")
  @ApiOperation({ summary: "Checkout giỏ hàng để chuyển sang thanh toán" })
  @ApiResponse({ status: 200, description: "Thanh toán thành công" })
  @ApiResponse({ status: 400, description: "Giỏ hàng trống hoặc sản phẩm không đủ số lượng" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        selectedItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productId: { type: "number" },
              quantity: { type: "number" },
            },
            required: ["productId", "quantity"],
          },
        },
      },
      required: ["selectedItems"],
    },
  })
  async checkout(
    @Req() req: Request,
    @Body() body: { selectedItems: { productId: number; quantity: number }[] }
  ) {
    const user = req.user as User;

    if (!body.selectedItems || body.selectedItems.length === 0) {
      throw new BadRequestException("Không có sản phẩm nào được chọn để thanh toán");
    }

    return this.cartService.checkout(user, body.selectedItems);
  }
}
