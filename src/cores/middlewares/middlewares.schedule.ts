import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { SaleStrategyService } from 'src/modules/strategySale/sale.service';
import { StrategySale } from 'src/modules/strategySale/entity/strategySale.entity';

@Injectable()
export class SaleSchedulerService {
  constructor(
    @InjectRepository(StrategySale)
    private readonly saleRepository: Repository<StrategySale>,
    private readonly saleService: SaleStrategyService,
  ) {}

  @Cron('0 0 * * * *') // Chạy mỗi giờ (00:00, 01:00, ...)
  async handleSaleActivation() {
    const now = new Date();

    // Tìm sale đang chạy và hết hạn
    const expiredSales = await this.saleRepository.find({
      where: {
        isActive: true,
        endDate: LessThan(now),
      },
    });

    // Tắt các sale hết hạn
    for (const sale of expiredSales) {
      await this.saleService.endSale(sale.id);
    }

    // Tìm sale hợp lệ
    const validSales = await this.saleRepository.find({
      where: {
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
        discountAmount: MoreThanOrEqual(0),
      },
      order: {
        discountAmount: 'DESC', // Ưu tiên discountAmount lớn nhất
        endDate: 'ASC', // Nếu bằng discountAmount, chọn sale ngắn hơn
      },
    });

    // Lấy sale đang chạy
    const activeSale = await this.saleService.getActiveSale();

    if (validSales.length === 0) {
      return;
    }

    // Chọn sale để bật
    const saleToActivate = validSales[0];

    if (!activeSale || activeSale.id !== saleToActivate.id) {
      if (activeSale) {
        // So sánh discountAmount
        if (saleToActivate.discountAmount > activeSale.discountAmount) {
          await this.saleService.endSale(activeSale.id);
          await this.saleService.updateSale(saleToActivate.id, { isActive: true });
        }
      } else {
        await this.saleService.updateSale(saleToActivate.id, { isActive: true });
      }
    }
  }
}