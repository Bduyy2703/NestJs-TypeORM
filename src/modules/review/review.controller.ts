import { Controller, Post, Body, UseInterceptors, UploadedFiles, Request, Get, Query, Param, Put, Delete, NotFoundException, BadRequestException, Patch } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { ReviewService } from './reveiew.service';
import { CreateReviewDto, UpdateReviewDto, ReviewResponseDto, CreateReviewReplyDto } from './dto/review.dto';
import { ApiTags, ApiSecurity, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Actions } from 'src/cores/decorators/action.decorator';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';
import { Public } from 'src/cores/decorators/public.decorator';

@Controller('reviews')
@ApiTags('Reviews')
@ApiSecurity('JWT-auth')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    // API mới: Lấy tất cả đánh giá (dành cho admin)
    @Get()
    @Actions('read')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Lấy tất cả đánh giá trên hệ thống (dành cho admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'isHidden', required: false, type: Boolean, description: 'Lọc theo trạng thái ẩn/hiện' })
    @ApiQuery({ name: 'productId', required: false, type: Number, description: 'Lọc theo sản phẩm' })
    @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Lọc theo người dùng' })
    @ApiResponse({ status: 200, description: 'List of all reviews', type: [ReviewResponseDto] })
    async getAllReviews(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('isHidden') isHidden?: boolean,
        @Query('productId') productId?: number,
        @Query('userId') userId?: number
    ) {
        return this.reviewService.getAllReviews(page, limit, isHidden, productId, userId);
    }

        // API mới: Toggle Like
    @Post(':id/toggle-like')
    @Actions('create')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Toggle Like cho một đánh giá' })
    @ApiResponse({ status: 200, description: 'Like toggled successfully', type: Object })
    async toggleLike(@Param('id') id: number, @Request() req) {
        const userId = req.user?.userId;
        if (!userId) throw new BadRequestException('User ID is required');
        const result = await this.reviewService.toggleLike(id, userId);
        return {
            message: result.liked ? 'Like added successfully' : 'Like removed successfully',
            liked: result.liked,
            likeCount: result.likeCount,
        };
    }

        // API trả lời đánh giá (từ yêu cầu trước)
    @Post(':id/reply')
    @Actions('create')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Admin trả lời đánh giá' })
    @ApiBody({ type: CreateReviewReplyDto })
    @ApiResponse({ status: 201, description: 'Reply created successfully', type: ReviewResponseDto })
    async createReply(
        @Param('id') reviewId: number,
        @Body() createReviewReplyDto: CreateReviewReplyDto,
        @Request() req,
    ) {
        const userId = req.user?.userId;
        if (!userId) throw new BadRequestException('User ID is required');
        const reply = await this.reviewService.createReply(reviewId, userId, createReviewReplyDto);
        return {
            message: 'Reply created successfully',
            reply,
        };
    }

    @Get('my-reviews')
    @Actions('read')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Lấy danh sách sản phẩm và đánh giá của người dùng hiện tại' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of reviews by the current user', type: [ReviewResponseDto] })
    async getMyReviews(
        @Request() req,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        const userId = req.user?.userId;
        if (!userId) throw new BadRequestException('User ID is required');

        return this.reviewService.getMyReviews(userId, page, limit);
    }

    @Post()
    @Actions('create')
    @Objectcode('REVIEW01')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: multer.memoryStorage(),
            limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
        })
    )
    @ApiOperation({ summary: 'Tạo đánh giá mới cho sản phẩm' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productId: { type: 'number' },
                rating: { type: 'number', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Review created successfully', type: ReviewResponseDto })
    async createReview(
        @Body() createReviewDto: CreateReviewDto,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req
    ) {
        console.log(createReviewDto)
        const userId = req.user?.userId;
        if (!userId) throw new BadRequestException('User ID is required');

        const review = await this.reviewService.createReview(userId, createReviewDto, files);
        return {
            message: 'Review created successfully',
            review,
        };
    }

    @Get('product/:productId')
    @Public()
    @ApiOperation({ summary: 'Lấy danh sách đánh giá của sản phẩm' })
    @ApiResponse({ status: 200, description: 'List of reviews', type: [ReviewResponseDto] })
    async getReviewsByProductId(
        @Param('productId') productId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.reviewService.getReviewsByProductId(productId, page, limit);
    }

    @Put(':id')
    @Actions('update')
    @Objectcode('REVIEW01')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: multer.memoryStorage(),
            limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
        })
    )
    @ApiOperation({ summary: 'Cập nhật đánh giá' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                rating: { type: 'number', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
                keepFiles: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            fileId: { type: 'string' },
                            fileName: { type: 'string' },
                            bucketName: { type: 'string' },
                        },
                        required: ['fileId', 'fileName', 'bucketName'],
                    },
                },
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Review updated successfully', type: ReviewResponseDto })
    async updateReview(
        @Param('id') id: number,
        @Body() updateReviewDto: UpdateReviewDto,
        @UploadedFiles() files: Express.Multer.File[],
        @Body('keepFiles') keepFiles: { fileId: string; fileName: string; bucketName: string }[],
        @Request() req
    ) {
        const userId = req.user?.userId;
        if (!userId) throw new BadRequestException('User ID is required');

        const review = await this.reviewService.updateReview(id, userId, updateReviewDto, files, keepFiles);
        return {
            message: 'Review updated successfully',
            review,
        };
    }

    @Delete(':id')
    @Actions('delete')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Xóa đánh giá' })
    async deleteReview(@Param('id') id: number, @Request() req) {
        const userId = req.user?.userId;
        if (!userId) throw new BadRequestException('User ID is required');

        await this.reviewService.deleteReview(id, userId);
        return { message: 'Review deleted successfully' };
    }

    @Get('top-rated-product')
    @Actions('read')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Lấy sản phẩm được đánh giá cao nhất' })
    @ApiQuery({ name: 'minReviews', required: false, type: Number, description: 'Số lượng đánh giá tối thiểu' })
    async getTopRatedProduct(@Query('minReviews') minReviews: number = 5) {
        return this.reviewService.getTopRatedProduct(minReviews);
    }

    @Get('lowest-rated-product')
    @Actions('read')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Lấy sản phẩm được đánh giá thấp nhất' })
    @ApiQuery({ name: 'minReviews', required: false, type: Number, description: 'Số lượng đánh giá tối thiểu' })
    async getLowestRatedProduct(@Query('minReviews') minReviews: number = 5) {
        return this.reviewService.getLowestRatedProduct(minReviews);
    }

    @Get('most-reviewed-product')
    @Actions('read')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Lấy sản phẩm có nhiều đánh giá nhất' })
    async getMostReviewedProduct() {
        return this.reviewService.getMostReviewedProduct();
    }

    @Get('products-by-rating')
    @Actions('read')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Lấy danh sách sản phẩm theo thứ tự đánh giá' })
    @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Thứ tự sắp xếp (ASC: thấp đến cao, DESC: cao đến thấp)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'minReviews', required: false, type: Number, description: 'Số lượng đánh giá tối thiểu' })
    async getProductsByRating(
        @Query('order') order: 'ASC' | 'DESC' = 'DESC',
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('minReviews') minReviews: number = 5
    ) {
        return this.reviewService.getProductsByRating(order, page, limit, minReviews);
    }

    @Get('product/:productId/statistics')
    @Public()
    @ApiOperation({ summary: 'Lấy thống kê đánh giá của một sản phẩm' })
    async getProductReviewStatistics(@Param('productId') productId: number) {
        return this.reviewService.getProductReviewStatistics(productId);
    }
    @Patch(':id/toggle-hidden')
    @Actions('update')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Admin bật/tắt ẩn đánh giá' })
    @ApiResponse({ status: 200, description: 'Review hidden or unhidden successfully' })
    async toggleHiddenReview(@Param('id') id: number) {
        const result = await this.reviewService.toggleHiddenReview(id);
        return result; // Trả về { message, isHidden }
    }
    @Delete(':id/admin')
    @Actions('delete')
    @Objectcode('REVIEW01')
    @ApiOperation({ summary: 'Admin xóa đánh giá' })
    async adminDeleteReview(@Param('id') id: number) {
        await this.reviewService.adminDeleteReview(id);
        return { message: 'Review deleted successfully by admin' };
    }
}