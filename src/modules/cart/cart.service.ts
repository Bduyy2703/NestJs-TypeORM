import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cart } from "./entity/cart.entity";
import { CartItem } from "./entity/cartItem.entity";
import { AddToCartDto} from "./dto/Add-to-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cartItem.dto"
import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";
import { User } from "src/modules/users/entities/user.entity";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductDetails) private productDetailsRepo: Repository<ProductDetails>
  ) {}

  // Lấy giỏ hàng của user
  async getCart(user: User) {
    const cart = await this.cartRepo.findOne({ where: { user }, relations: ["cartItems", "cartItems.productDetails"] });
    return cart || { cartItems: [] }; // Nếu chưa có giỏ hàng thì trả về mảng rỗng
  }

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(user: User, dto: AddToCartDto) {
    let cart = await this.cartRepo.findOne({ where: { user }, relations: ["cartItems"] });
    if (!cart) {
      cart = this.cartRepo.create({ user });
      await this.cartRepo.save(cart);
    }
  
    const product = await this.productDetailsRepo.findOne({ where: { id: dto.productDetailsId } });
    if (!product) throw new NotFoundException("Sản phẩm không tồn tại");
  
    if (dto.quantity > product.stock) {
      throw new BadRequestException(`Sản phẩm ${dto.productDetailsId} không đủ hàng trong kho`);
    }
  
    let cartItem = await this.cartItemRepo.findOne({
      where: { cart, productDetails: product },
    });
  
    if (cartItem) {
      const newQuantity = cartItem.quantity + dto.quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(`Không thể thêm vào giỏ, số lượng vượt quá kho`);
      }
      cartItem.quantity = newQuantity;
    } else {
      cartItem = this.cartItemRepo.create({ cart, productDetails: product, quantity: dto.quantity });
    }
  
    return this.cartItemRepo.save(cartItem);
  }
  

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  async updateCartItem(cartItemId: number, dto: UpdateCartItemDto) {
    const cartItem = await this.cartItemRepo.findOne({ where: { id: cartItemId }, relations: ["productDetails"] });
    if (!cartItem) throw new NotFoundException("Sản phẩm không có trong giỏ hàng");
  
    if (dto.quantity > cartItem.productDetails.stock) {
      throw new BadRequestException(`Không thể cập nhật, số lượng vượt quá kho`);
    }
  
    cartItem.quantity = dto.quantity;
    return this.cartItemRepo.save(cartItem);
  }

  // Xóa sản phẩm khỏi giỏ hàng
  async removeCartItem(cartItemId: number) {
    const cartItem = await this.cartItemRepo.findOne({ where: { id: cartItemId } });
    if (!cartItem) throw new NotFoundException("Sản phẩm không tồn tại");

    return this.cartItemRepo.remove(cartItem);
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(user: User) {
    const cart = await this.cartRepo.findOne({ where: { user }, relations: ["cartItems"] });
    if (!cart) throw new NotFoundException("Giỏ hàng không tồn tại");
  
    await this.cartItemRepo.remove(cart.cartItems);
    await this.cartRepo.remove(cart); // Xóa cả giỏ hàng chính
  
    return { message: "Đã xóa toàn bộ giỏ hàng" };
  }

  // api check out để chuyển sang api thanh toán 
  async checkout(user: User) {
    const cart = await this.cartRepo.findOne({ where: { user }, relations: ["cartItems", "cartItems.productDetails"] });
    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException("Giỏ hàng trống, không thể thanh toán");
    }
  
    for (const cartItem of cart.cartItems) {
      const product = cartItem.productDetails;
      
      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(`Sản phẩm ${product.id} không đủ số lượng`);
      }
  
      product.stock -= cartItem.quantity;
      product.sold += cartItem.quantity;
      await this.productDetailsRepo.save(product);
    }
  
    // Sau khi trừ kho thành công, xóa giỏ hàng
    await this.cartItemRepo.remove(cart.cartItems);
    await this.cartRepo.remove(cart);
  
    return { message: "Thanh toán thành công" };
  }
  
}



  