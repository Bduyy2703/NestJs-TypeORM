import {
    Controller,
    Post,
    Delete,
    Get,
    Body,
    Param,
    Request,
    UseGuards,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/wishlist.dto';
import { ApiTags, ApiSecurity, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Actions } from 'src/cores/decorators/action.decorator';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@ApiSecurity('JWT-auth')
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Post()
    @Actions('create')
    @Objectcode('WISHLIST01')
    @ApiOperation({ summary: 'Thêm biến thể sản phẩm vào wishlist' })
    @ApiResponse({ status: 201, description: 'Đã thêm vào wishlist' })
    async addToWishlist(@Request() req, @Body() dto: CreateWishlistDto) {
        const userId = req.user?.userId;
        if (!userId) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        return this.wishlistService.addToWishlist(userId, dto);
    }

    @Delete(':productDetailId')
    @Actions('delete')
    @Objectcode('WISHLIST01')
    @ApiOperation({ summary: 'Xóa biến thể sản phẩm khỏi wishlist' })
    @ApiResponse({ status: 200, description: 'Đã xóa khỏi wishlist' })
    async removeFromWishlist(@Request() req, @Param('productDetailId') productDetailId: number) {
        const userId = req.user?.userId;
        if (!userId) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        return this.wishlistService.removeFromWishlist(userId, +productDetailId);
    }

    @Get()
    @Actions('read')
    @Objectcode('WISHLIST01')
    @ApiOperation({ summary: 'Lấy danh sách wishlist của user' })
    @ApiResponse({ status: 200, description: 'Danh sách wishlist' })
    async getWishlist(@Request() req) {
        const userId = req.user?.userId;
        if (!userId) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        return this.wishlistService.getWishlist(userId);
    }

    @Get('check/:productDetailId')
    @Actions('read')
    @Objectcode('WISHLIST01')
    @ApiOperation({ summary: 'Kiểm tra trạng thái yêu thích của biến thể sản phẩm' })
    @ApiResponse({ status: 200, description: 'Trạng thái yêu thích' })
    async checkFavorite(@Request() req, @Param('productDetailId') productDetailId: number) {
        const userId = req.user?.userId;
        if (!userId) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        const isFavorite = await this.wishlistService.isFavorite(userId, +productDetailId);
        return { isFavorite };
    }

    @Post('toggle')
    @Actions('update')
    @Objectcode('WISHLIST01')
    @ApiOperation({ summary: 'Thêm hoặc bỏ yêu thích biến thể sản phẩm' })
    @ApiResponse({ status: 200, description: 'Trạng thái sau khi toggle' })
    async toggleFavorite(@Request() req, @Body() dto: CreateWishlistDto) {
        const userId = req.user?.userId;
        if (!userId) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
        const isFavorite = await this.wishlistService.toggleFavorite(userId, dto.productDetailId);
        return { isFavorite };
    }
}