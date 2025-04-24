import { Injectable, Logger } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SaleMailLog } from '../sale-mail-log';
import { Wishlist } from 'src/modules/wishlist/entity/wishlist.entity';
import { MailService } from '../mail.service';
import { SaleStrategyService } from 'src/modules/strategySale/sale.service';

@Injectable()
export class MailSaleCronjob {
  private readonly logger = new Logger(MailSaleCronjob.name);

  constructor(
    private readonly saleService: SaleStrategyService,
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(SaleMailLog)
    private readonly saleMailLogRepo: Repository<SaleMailLog>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Gửi mail cho user wishlist sản phẩm thuộc các sale hợp lệ (chỉ gửi 1 lần/user/sale)
   * @param validSales Danh sách sale hợp lệ vừa được bật
   */
  async handle(validSales: any[]) {
    for (const sale of validSales) {
      try {
        const productIds = await this.saleService.getProductIdsOfSale(sale.id);
        if (!productIds.length) continue;
  
        const wishlists = await this.wishlistRepo.find({
          where: { productDetail: { product: { id: In(productIds) } } },
          relations: ['user', 'productDetail', 'productDetail.product'],
        });
  
        // Gom wishlist theo user (userId là UUID string)
        const userWishlistMap = new Map<string, Wishlist[]>();
        for (const w of wishlists) {
          const userId = w.user.id; // giữ nguyên là string
          if (!userWishlistMap.has(userId)) userWishlistMap.set(userId, []);
          userWishlistMap.get(userId)?.push(w);
        }
  
        for (const [userId, items] of userWishlistMap.entries()) {
          // Kiểm tra log đã gửi mail cho user-sale này chưa
          const sent = await this.saleMailLogRepo.findOne({ where: { userId, saleId: sale.id } });
          if (sent) continue;
          await this.mailService.sendSaleMail(
            userId,
            items.map(i => i.productDetail.product),
            sale.id
          );
          await this.saleMailLogRepo.save({ userId, saleId: sale.id, sentAt: new Date() });
        }
      } catch (error) {
        this.logger.error(`Lỗi khi xử lý gửi mail sale ${sale.id}: ${error}`, error);
      }
    }
  }
}