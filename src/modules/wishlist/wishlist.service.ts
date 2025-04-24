import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { CreateWishlistDto } from './dto/wishlist.dto';
import { Wishlist } from './entity/wishlist.entity';
import { ProductDetails } from '../product-details/entity/productDetail.entity';
import { File } from '../files/file.entity'; // Import file entity nếu có
@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepo: Repository<Wishlist>,
    @InjectRepository(ProductDetails)
    private productDetailRepo: Repository<ProductDetails>,
    @InjectRepository(File)
    private fileRepo: Repository<File>, // Inject file repository nếu có
  ) {}

  async addToWishlist(userId: number, dto: CreateWishlistDto) {
    const productDetail = await this.productDetailRepo.findOne({ where: { id: dto.productDetailId } });
    if (!productDetail) throw new NotFoundException('Product detail not found');
    const existed = await this.wishlistRepo.findOne({ where: { user: { id: userId } as unknown as User, productDetail: { id: dto.productDetailId } } });
    if (existed) throw new ConflictException('Product detail already in wishlist');
    const wishlist = this.wishlistRepo.create({ user: { id: userId } as unknown as User, productDetail });
    return this.wishlistRepo.save(wishlist);
  }

  async removeFromWishlist(userId: number, productDetailId: number) {
    const wishlist = await this.wishlistRepo.findOne({
      where: { user: { id: userId } as unknown as User, productDetail: { id: productDetailId } },
    });
    if (!wishlist) throw new NotFoundException('Wishlist item not found');
    return this.wishlistRepo.remove(wishlist);
  }

  async getWishlist(userId: number) {
    const wishlist = await this.wishlistRepo.find({
      where: { user: { id: userId.toString() } },
      relations: ['productDetail', 'productDetail.product'],
      order: { createdAt: 'DESC' },
    });

    // Lấy danh sách productId từ các productDetail
    const productIds = wishlist.map(item => item.productDetail.product.id);

    // Lấy tất cả ảnh liên quan đến các productId này (nếu có entity File)
    const files = await this.fileRepo.find({
      where: { targetId: In(productIds), targetType: 'product' },
    });

    // Map ảnh vào từng wishlist item
    return wishlist.map(item => {
      const images = files
        .filter(f => f.targetId === item.productDetail.product.id)
        .map(f => f.fileUrl);
      return {
        ...item,
        images,
      };
    });
  }
  async isFavorite(userId: number, productDetailId: number): Promise<boolean> {
    const existed = await this.wishlistRepo.findOne({
      where: { user: { id: userId.toString() }, productDetail: { id: productDetailId } },
    });
    return !!existed;
  }

  async toggleFavorite(userId: number, productDetailId: number): Promise<boolean> {
    const existed = await this.wishlistRepo.findOne({
      where: { user: { id: userId.toString() }, productDetail: { id: productDetailId } },
    });
    if (existed) {
      await this.wishlistRepo.remove(existed);
      return false;
    } else {
      const productDetail = await this.productDetailRepo.findOne({ where: { id: productDetailId } });
      if (!productDetail) throw new NotFoundException('Product detail not found');
      const wishlist = this.wishlistRepo.create({ user: { id: userId } as any, productDetail });
      await this.wishlistRepo.save(wishlist);
      return true;
    }
  }
}