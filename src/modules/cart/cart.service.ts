import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cart } from "./entity/cart.entity";
import { CartItem } from "./entity/cartItem.entity";
import { AddToCartDto } from "./dto/Add-to-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cartItem.dto"
import { ProductDetails } from "src/modules/product-details/entity/productDetail.entity";
import { User } from "src/modules/users/entities/user.entity";
import { File } from "../files/file.entity";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
    @InjectRepository(ProductDetails) private productDetailsRepo: Repository<ProductDetails>,
    @InjectRepository(File) private fileRepo: Repository<File>,
  ) { }

  // Lấy giỏ hàng của user
  async getCart(userId: string) {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ["cartItems", "cartItems.productDetails", "cartItems.productDetails.product"] // Join thêm bảng product
    });

    if (!cart) return { cartItems: [] };

    // Tính tổng giá trị cho từng sản phẩm trong giỏ hàng
    const cartWithTotal = {
      ...cart,
      cartItems: cart.cartItems.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.productDetails.product.finalPrice, // Lấy price từ product
      })),
      totalAmount: cart.cartItems.reduce(
        (sum, item) => sum + item.quantity * item.productDetails.product.finalPrice,
        0
      ), // Tổng tiền giỏ hàng
      totalQuantity: cart.cartItems.reduce((sum, item) => sum + item.quantity, 0), // Tổng số lượng sản phẩm
    };

    return cartWithTotal;
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("Người dùng không tồn tại");

    let cart = await this.cartRepo.findOne({
      where: { user },
      relations: ["cartItems", "cartItems.productDetails"]
    });
    if (!cart) {
      cart = this.cartRepo.create({ user, cartItems: [] });
      await this.cartRepo.save(cart);
    }
    const product = await this.productDetailsRepo.findOne({ where: { id: dto.productDetailsId } });
    if (!product) throw new NotFoundException("Sản phẩm không tồn tại");

    console.log(product)
    if (dto.quantity > product.stock) {
      throw new BadRequestException(`Sản phẩm không đủ hàng trong kho`);
    }

    let cartItem = cart.cartItems.find(item => item.productDetails.id === dto.productDetailsId);

    if (cartItem) {

      const newQuantity = cartItem.quantity + dto.quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(`Không thể thêm vào giỏ, số lượng vượt quá kho`);
      }
      cartItem.quantity = newQuantity;
      await this.cartItemRepo.save(cartItem)
    } else {

      cartItem = this.cartItemRepo.create({
        cart,
        productDetails: product,
        quantity: dto.quantity,
      });
      await this.cartItemRepo.save(cartItem)
      cart.cartItems.push(cartItem);

    }
    await this.cartRepo.save(cart);
    return cartItem.quantity, cartItem.productDetails;
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
  async checkout(
    user: User,
    selectedItems: { productId: number; quantity: number }[]
  ) {
    if (!selectedItems || selectedItems.length === 0) {
      throw new BadRequestException("Không có sản phẩm nào được chọn để thanh toán");
    }
  
    // Lấy giỏ hàng của user
    const cart = await this.cartRepo.findOne({
      where: { user },
      relations: ["cartItems", "cartItems.productDetails", "cartItems.productDetails.product"],
    });
  
    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException("Giỏ hàng trống");
    }
  
    let totalAmount = 0;
    const checkoutItems = [];
  
    for (const item of selectedItems) {
      const cartItem = cart.cartItems.find(ci => ci.productDetails.id === item.productId);
  
      if (!cartItem) {
        throw new BadRequestException(`Sản phẩm ${item.productId} không có trong giỏ hàng`);
      }
      
      if (cartItem.quantity < item.quantity) {
        throw new BadRequestException(`Sản phẩm ${item.productId} số lượng không đủ`);
      }
  
      const productDetails = cartItem.productDetails;
      const product = productDetails.product;
  
      if (productDetails.stock < item.quantity) {
        throw new BadRequestException(`Sản phẩm "${product.name}" chỉ còn ${productDetails.stock} trong kho`);
      }
  
      // Lấy hình ảnh sản phẩm từ bảng file
      const productImage = await this.fileRepo.findOne({
        where: { targetId: product.id, targetType: "product" }
      });
  
      // Tính tổng giá từng sản phẩm
      const totalPrice = product.finalPrice * item.quantity;
      totalAmount += totalPrice;
  
      checkoutItems.push({
        productId: product.id,
        name: product.name,
        image: productImage ? productImage.fileUrl : null, // Nếu có ảnh thì lấy, không có thì null
        quantity: item.quantity,
        price: product.finalPrice,
        totalPrice,
      });
    }
  
    return {
      message: "Xác nhận đơn hàng thành công",
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
        addresses: user.addresses, // Lấy danh sách địa chỉ
      },
      checkoutItems,
      totalAmount,
    };
  }  
}



