import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review } from './entity/review.entity';
import { Invoice } from '../invoice/entity/invoice.entity';
import { InvoiceItem } from '../invoice/entity/invoiceItem.entity';
import { File } from '../files/file.entity';
import { MinioService } from '../files/minio/minio.service';
import { FileRepository } from '../files/file.repository';
import { CreateReviewDto, UpdateReviewDto, ReviewResponseDto } from './dto/review.dto';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { Product } from '../product/entity/product.entity';

@Injectable()
export class ReviewService {
    private readonly logger = new Logger(ReviewService.name);

    constructor(
        @InjectRepository(Review)
        private reviewRepo: Repository<Review>,
        @InjectRepository(Invoice)
        private invoiceRepo: Repository<Invoice>,
        @InjectRepository(InvoiceItem)
        private invoiceItemRepo: Repository<InvoiceItem>,
        @InjectRepository(File)
        private fileRepo: Repository<File>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        private readonly minioService: MinioService,
        private readonly fileRepository: FileRepository,
    ) { }


    async getAllReviews(page: number, limit: number, isHidden?: boolean, productId?: number, userId?: number) {
        // Bước 1: Lấy danh sách đánh giá
        const query = this.reviewRepo.createQueryBuilder('review')
            .leftJoinAndSelect('review.product', 'product')
            .skip((page - 1) * limit)
            .take(limit);

        if (isHidden !== undefined) {
            query.andWhere('review.isHidden = :isHidden', { isHidden });
        }
        if (productId) {
            query.andWhere('review.productId = :productId', { productId });
        }
        if (userId) {
            query.andWhere('review.userId = :userId', { userId });
        }

        const [reviews, total] = await query.getManyAndCount();

        // Bước 2: Lấy hình ảnh từ bảng File cho từng review
        const reviewIds = reviews.map(review => review.id);
        let images: File[] = [];
        if (reviewIds.length > 0) {
            images = await this.fileRepo.find({
                where: {
                    targetId: In(reviewIds),
                    targetType: 'review',
                },
            });
        }

        // Bước 3: Gộp hình ảnh vào từng review
        const reviewsWithImages = reviews.map(review => {
            const reviewImages = images.filter(image => image.targetId === review.id);
            return {
                ...review,
                images: reviewImages,
            };
        });

        return { reviews: reviewsWithImages, total };
    }
    
    async createReview(
        userId: string,
        createReviewDto: CreateReviewDto,
        files: Express.Multer.File[]
    ): Promise<ReviewResponseDto> {
        const { productId, rating, comment } = createReviewDto;

        // Kiểm tra xem người dùng đã mua sản phẩm chưa
        const hasPurchased = await this.checkIfUserPurchased(userId, productId);
        if (!hasPurchased) {
            throw new BadRequestException('Bạn chỉ có thể đánh giá sản phẩm đã mua');
        }

        // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
        const existingReview = await this.reviewRepo.findOne({
            where: { userId, productId },
        });
        if (existingReview) {
            throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
        }

        // Tạo đánh giá
        const review = this.reviewRepo.create({
            userId,
            productId,
            rating,
            comment,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await this.reviewRepo.save(review);

        // Upload ảnh (nếu có)
        let uploadedImages: File[] = [];
        if (files && files.length > 0) {
            uploadedImages = await Promise.all(
                files.map(async (file) => {
                    const uuid = uuidv4();
                    const objectName = `review-${review.id}/${uuid}-${file.originalname}`;

                    await this.minioService.uploadFileFromBuffer(
                        'public',
                        objectName,
                        file.buffer,
                        file.mimetype
                    );

                    const fileUrl = await this.minioService.getUrlByName('public', [objectName]);

                    return this.fileRepository.createFile({
                        fileId: uuid,
                        bucketName: 'public',
                        fileName: objectName,
                        fileUrl: fileUrl[0],
                        targetId: review.id,
                        targetType: 'review',
                    });
                })
            );
        }

        this.logger.log(`Review ${review.id} created successfully by user ${userId}`);

        // Trả về ReviewResponseDto
        return {
            id: review.id,
            userId: review.userId,
            user: review.user,
            productId: review.productId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            isHidden : review.isHidden,
            images: uploadedImages,
        };
    }
    async getMyReviews(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
    
        const [reviews, total] = await this.reviewRepo.findAndCount({
            where: { userId },
            relations: ['product', 'user'], // Load cả product và user
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
    
        const reviewsWithImages = await Promise.all(
            reviews.map(async (review) => {
                const images = await this.fileRepo.find({
                    where: { targetId: review.id, targetType: 'review' },
                });
                return {
                    id: review.id,
                    userId: review.userId,
                    user: review.user, // Thêm user
                    productId: review.productId,
                    product: review.product,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt,
                    isHidden: review.isHidden,
                    images,
                } as ReviewResponseDto;
            })
        );
    
        return {
            reviews: reviewsWithImages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    // Kiểm tra xem người dùng đã mua sản phẩm chưa
    private async checkIfUserPurchased(userId: string, productId: number): Promise<boolean> {
        const invoices = await this.invoiceRepo.find({
            where: { userId, status: 'PAID' },
            relations: ['items'],
        });

        for (const invoice of invoices) {
            const items = await this.invoiceItemRepo.find({
                where: { invoiceId: invoice.id },
                relations: ['productDetail', 'productDetail.product'],
            });

            const hasProduct = items.some(item => item.productDetail?.product?.id === productId);
            if (hasProduct) return true;
        }

        return false;
    }

    // Lấy danh sách đánh giá của sản phẩm
    async getReviewsByProductId(productId: number, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await this.reviewRepo.findAndCount({
            where: { productId , isHidden: false},
            relations: ['user', 'product'], // Load cả user và product
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
    
        const reviewsWithImages = await Promise.all(
            reviews.map(async (review) => {
                const images = await this.fileRepo.find({
                    where: { targetId: review.id, targetType: 'review' },
                });
                return {
                    id: review.id,
                    userId: review.userId,
                    user: review.user, // Thêm user
                    productId: review.productId,
                    product: review.product,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt,
                    isHidden: review.isHidden,
                    images,
                } as ReviewResponseDto;
            })
        );
    
        return {
            reviews: reviewsWithImages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // Cập nhật đánh giá
    async updateReview(
        reviewId: number,
        userId: string,
        updateReviewDto: UpdateReviewDto,
        files: Express.Multer.File[],
        keepFiles: { fileId: string; fileName: string; bucketName: string }[]
    ): Promise<ReviewResponseDto> {
        const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Đánh giá không tồn tại');
        if (review.userId !== userId) throw new ForbiddenException('Bạn không có quyền cập nhật đánh giá này');

        // Cập nhật thông tin đánh giá
        if (updateReviewDto.rating) review.rating = updateReviewDto.rating;
        if (updateReviewDto.comment) review.comment = updateReviewDto.comment;
        review.updatedAt = new Date();
        await this.reviewRepo.save(review);

        // Xử lý hình ảnh
        const existingFiles = await this.fileRepo.find({
            where: { targetId: reviewId, targetType: 'review' },
        });

        // Xóa các file không được giữ
        const keepFileIds = keepFiles ? keepFiles.map(f => f.fileId) : [];
        const filesToDelete = existingFiles.filter(f => !keepFileIds.includes(f.fileId));
        for (const file of filesToDelete) {
            await this.minioService.deleteFile(file.bucketName, file.fileName);
            await this.fileRepo.remove(file);
        }

        // Upload ảnh mới
        let uploadedImages: File[] = [];
        if (files && files.length > 0) {
            uploadedImages = await Promise.all(
                files.map(async (file) => {
                    const uuid = uuidv4();
                    const objectName = `review-${review.id}/${uuid}-${file.originalname}`;

                    await this.minioService.uploadFileFromBuffer(
                        'public',
                        objectName,
                        file.buffer,
                        file.mimetype
                    );

                    const fileUrl = await this.minioService.getUrlByName('public', [objectName]);

                    return this.fileRepository.createFile({
                        fileId: uuid,
                        bucketName: 'public',
                        fileName: objectName,
                        fileUrl: fileUrl[0],
                        targetId: review.id,
                        targetType: 'review',
                    });
                })
            );
        }

        const updatedFiles = await this.fileRepo.find({
            where: { targetId: reviewId, targetType: 'review' },
        });

        return {
            id: review.id,
            userId: review.userId,
            user: review.user,
            productId: review.productId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            isHidden : review.isHidden,
            images: updatedFiles,
        };
    }

    // Xóa đánh giá
    async deleteReview(reviewId: number, userId: string): Promise<void> {
        const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Đánh giá không tồn tại');
        if (review.userId !== userId) throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');

        // Xóa hình ảnh liên quan
        const files = await this.fileRepo.find({
            where: { targetId: reviewId, targetType: 'review' },
        });
        for (const file of files) {
            await this.minioService.deleteFile(file.bucketName, file.fileName);
            await this.fileRepo.remove(file);
        }

        // Xóa đánh giá
        await this.reviewRepo.remove(review);
    }

  // Lấy sản phẩm được đánh giá cao nhất
async getTopRatedProduct(minReviews: number = 1): Promise<{ product: Product; averageRating: number; totalReviews: number; images: File[] }> {
    const result = await this.reviewRepo
        .createQueryBuilder('review')
        .select('review.productId', 'productId')
        .addSelect('AVG(review.rating)', 'averageRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.isHidden = :isHidden', { isHidden: false })
        .groupBy('review.productId')
        .having('COUNT(review.id) >= :minReviews', { minReviews })
        .orderBy('AVG(review.rating)', 'DESC')
        .limit(1)
        .getRawOne();

    if (!result) {
        throw new NotFoundException('Không tìm thấy sản phẩm nào đáp ứng điều kiện');
    }

    const product = await this.productRepo.findOne({ where: { id: result.productId } });
    if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Lấy hình ảnh của sản phẩm
    const images = await this.fileRepo.find({
        where: {
            targetId: product.id,
            targetType: 'product',
        },
    });

    return {
        product,
        averageRating: parseFloat(result.averageRating),
        totalReviews: parseInt(result.totalReviews),
        images, // Thêm trường images
    };
}

// Lấy sản phẩm được đánh giá thấp nhất
async getLowestRatedProduct(minReviews: number = 1): Promise<{ product: Product; averageRating: number; totalReviews: number; images: File[] }> {
    const result = await this.reviewRepo
        .createQueryBuilder('review')
        .select('review.productId', 'productId')
        .addSelect('AVG(review.rating)', 'averageRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.isHidden = :isHidden', { isHidden: false })
        .groupBy('review.productId')
        .having('COUNT(review.id) >= :minReviews', { minReviews })
        .orderBy('AVG(review.rating)', 'ASC')
        .limit(1)
        .getRawOne();

    if (!result) {
        throw new NotFoundException('Không tìm thấy sản phẩm nào đáp ứng điều kiện');
    }

    const product = await this.productRepo.findOne({ where: { id: result.productId } });
    if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Lấy hình ảnh của sản phẩm
    const images = await this.fileRepo.find({
        where: {
            targetId: product.id,
            targetType: 'product',
        },
    });

    return {
        product,
        averageRating: parseFloat(result.averageRating),
        totalReviews: parseInt(result.totalReviews),
        images, // Thêm trường images
    };
}

// Lấy sản phẩm có nhiều đánh giá nhất
async getMostReviewedProduct(): Promise<{ product: Product; totalReviews: number; images: File[] }> {
    const result = await this.reviewRepo
        .createQueryBuilder('review')
        .select('review.productId', 'productId')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.isHidden = :isHidden', { isHidden: false })
        .groupBy('review.productId')
        .orderBy('COUNT(review.id)', 'DESC')
        .limit(1)
        .getRawOne();

    if (!result) {
        throw new NotFoundException('Không tìm thấy sản phẩm nào có đánh giá');
    }

    const product = await this.productRepo.findOne({ where: { id: result.productId } });
    if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Lấy hình ảnh của sản phẩm
    const images = await this.fileRepo.find({
        where: {
            targetId: product.id,
            targetType: 'product',
        },
    });

    return {
        product,
        totalReviews: parseInt(result.totalReviews),
        images, // Thêm trường images
    };
}

// Lấy danh sách sản phẩm theo thứ tự đánh giá
async getProductsByRating(order: 'ASC' | 'DESC' = 'DESC', page: number = 1, limit: number = 10, minReviews: number = 5) {
    const skip = (page - 1) * limit;

    const query = this.reviewRepo
        .createQueryBuilder('review')
        .select('review.productId', 'productId')
        .addSelect('AVG(review.rating)', 'averageRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('review.isHidden = :isHidden', { isHidden: false })
        .groupBy('review.productId')
        .having('COUNT(review.id) >= :minReviews', { minReviews })
        .orderBy('AVG(review.rating)', order)
        .skip(skip)
        .take(limit);

    const results = await query.getRawMany();
    const total = await query.getCount();

    // Lấy danh sách productId
    const productIds = results.map(result => result.productId);

    // Lấy hình ảnh của tất cả sản phẩm
    let images: File[] = [];
    if (productIds.length > 0) {
        images = await this.fileRepo.find({
            where: {
                targetId: In(productIds),
                targetType: 'product',
            },
        });
    }

    // Gộp sản phẩm và hình ảnh
    const productsWithStats = await Promise.all(
        results.map(async (result) => {
            const product = await this.productRepo.findOne({ where: { id: result.productId } });
            const productImages = images.filter(image => image.targetId === result.productId);
            return {
                product,
                averageRating: parseFloat(result.averageRating),
                totalReviews: parseInt(result.totalReviews),
                images: productImages, // Thêm trường images
            };
        })
    );

    return {
        products: productsWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

    // Lấy thống kê đánh giá của một sản phẩm
    async getProductReviewStatistics(productId: number) {
        const reviews = await this.reviewRepo.find({
            where: { productId, isHidden: false },
        });

        if (!reviews || reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: {
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0,
                },
            };
        }

        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

        const ratingDistribution = {
            1: reviews.filter(r => r.rating === 1).length,
            2: reviews.filter(r => r.rating === 2).length,
            3: reviews.filter(r => r.rating === 3).length,
            4: reviews.filter(r => r.rating === 4).length,
            5: reviews.filter(r => r.rating === 5).length,
        };

        return {
            averageRating: parseFloat(averageRating.toFixed(2)),
            totalReviews,
            ratingDistribution,
        };
    }

    // Admin ẩn đánh giá
    async toggleHiddenReview(reviewId: number): Promise<{ message: string; isHidden: boolean }> {
        const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Đánh giá không tồn tại');
    
        // Toggle trạng thái isHidden
        review.isHidden = !review.isHidden;
        review.updatedAt = new Date();
        await this.reviewRepo.save(review);
    
        // Trả về thông điệp phù hợp
        const message = review.isHidden ? 'Review hidden successfully' : 'Review unhidden successfully';
        return { message, isHidden: review.isHidden };
    }

    // Admin xóa đánh giá
    async adminDeleteReview(reviewId: number): Promise<void> {
        const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Đánh giá không tồn tại');

        // Xóa hình ảnh liên quan
        const files = await this.fileRepo.find({
            where: { targetId: reviewId, targetType: 'review' },
        });
        for (const file of files) {
            await this.minioService.deleteFile(file.bucketName, file.fileName);
            await this.fileRepo.remove(file);
        }

        // Xóa đánh giá
        await this.reviewRepo.remove(review);
    }
}