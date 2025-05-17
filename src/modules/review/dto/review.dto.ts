import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer'; // Import Type từ class-transformer
import { User } from '../../users/entities/user.entity';
import { File } from '../../files/file.entity';

export class CreateReviewDto {
    @ApiProperty({ description: 'ID của sản phẩm' })
    @IsNotEmpty()
    @Type(() => Number) // Chuyển đổi từ string sang number
    @IsInt() // Đảm bảo là số nguyên
    productId: number;

    @ApiProperty({ description: 'Điểm đánh giá (1-5)' })
    @Type(() => Number) // Chuyển đổi từ string sang number
    @IsInt() // Đảm bảo là số nguyên
    @Min(1)
    @Max(5)
    rating: number;

    @ApiProperty({ description: 'Nội dung đánh giá' })
    @IsNotEmpty()
    @IsString()
    comment: string;
}
export class UpdateReviewDto {
    @ApiProperty({ description: 'Điểm đánh giá (1-5)', required: false })
    @Type(() => Number) // Chuyển đổi từ string sang number
    @IsInt() // Đảm bảo là số nguyên
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiProperty({ description: 'Nội dung đánh giá', required: false })
    @IsNotEmpty()
    @IsString()
    comment?: string;
}

export class ReviewResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    user: User;

    @ApiProperty()
    productId: number;

    @ApiProperty()
    rating: number;

    @ApiProperty()
    comment: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    isHidden: boolean;

    @ApiProperty({ type: [File] })
    images: File[];
    
    @ApiProperty({ description: 'Số lượt Like' })
    likeCount: number;

    @ApiProperty({ description: 'Người dùng hiện tại đã Like hay chưa' })
    isLikedByUser: boolean;

    @ApiProperty({ description: 'Phản hồi của Admin', required: false })
    reply?: {
        id: number;
        content: string;
        adminId: string;
        createdAt: Date;
        updatedAt: Date;
    }; 
}
export class CreateReviewReplyDto {
    @ApiProperty({ description: 'Nội dung phản hồi của Admin' })
    @IsNotEmpty()
    @IsString()
    content: string;
}