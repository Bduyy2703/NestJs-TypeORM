import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entity/review.entity';
import { ReviewService } from './reveiew.service';
import { ReviewController } from './review.controller';
import { Invoice } from '../invoice/entity/invoice.entity';
import { InvoiceItem } from '../invoice/entity/invoiceItem.entity';
import { File } from '../files/file.entity';
import { Product } from '../product/entity/product.entity';
import { MinioService } from '../files/minio/minio.service';
import { FileRepository } from '../files/file.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review, Invoice, InvoiceItem, File, Product]),
    ],
    controllers: [ReviewController],
    providers: [ReviewService, MinioService, FileRepository],
})
export class ReviewModule {}