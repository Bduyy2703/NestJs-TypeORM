import { IsEmail, IsNotEmpty, IsPhoneNumber, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Địa chỉ email của người dùng', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mật khẩu của người dùng (ít nhất 6 ký tự)', example: 'securePassword123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'Tên người dùng (có thể để trống)', example: 'John Doe' })
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ description: 'Tên vai trò, ví dụ: "user" hoặc "admin"', example: 'user' })
  roleName?: string;

  @ApiProperty({ description: 'Số điện thoại của người dùng (theo định dạng VN)', example: '+84912345678' })
  @IsPhoneNumber('VN')
  phoneNumber: string;
}