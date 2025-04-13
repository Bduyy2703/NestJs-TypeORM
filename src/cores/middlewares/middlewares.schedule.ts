import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { SaleStrategyService } from 'src/modules/strategySale/sale.service';
import { StrategySale } from 'src/modules/strategySale/entity/strategySale.entity';

@Injectable()
export class SaleSchedulerService {
  private readonly logger = new Logger(SaleSchedulerService.name);

  constructor(
    @InjectRepository(StrategySale)
    private readonly saleRepository: Repository<StrategySale>,
    private readonly saleService: SaleStrategyService,
  ) {}

  @Cron('*/30 * * * * *') // Chạy mỗi 30 giây để test
  async handleSaleActivation() {
    const now = new Date();
    this.logger.log(`Scheduler chạy lúc ${now.toISOString()}`);

    // 1. Tìm và tắt sale hết hạn
    const expiredSales = await this.saleRepository.find({
      where: {
        isActive: true,
        endDate: LessThan(now),
      },
    });

    if (expiredSales.length === 0) {
      this.logger.log('Không có sale nào hết hạn.');
    } else {
      this.logger.log(`Tìm thấy ${expiredSales.length} sale hết hạn: ${expiredSales.map(s => s.id).join(', ')}`);
      for (const sale of expiredSales) {
        this.logger.log(`Tắt sale ${sale.id} (hết hạn)`);
        await this.saleService.updateSale(sale.id, { isActive: false });
      }
    }

    // 2. Tìm tất cả sale hợp lệ
    const validSales = await this.saleRepository.find({
      where: {
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
        discountAmount: MoreThanOrEqual(0),
      },
    });

    if (validSales.length === 0) {
      this.logger.log('Không có sale nào hợp lệ để bật.');
    } else {
      this.logger.log(`Tìm thấy ${validSales.length} sale hợp lệ: ${validSales.map(s => s.id).join(', ')}`);
      for (const sale of validSales) {
        this.logger.log(`Bật sale ${sale.id}`);
        await this.saleService.updateSale(sale.id, { isActive: true });
      }
    }
  }
}