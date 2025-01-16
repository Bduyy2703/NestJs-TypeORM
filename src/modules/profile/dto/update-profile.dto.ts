import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateProfileDto } from './create-profile.dto';

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  @ApiProperty({
    description: 'Tên đầu tiên của người dùng (tùy chọn)',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Họ của người dùng (tùy chọn)',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Trạng thái kích hoạt hồ sơ (true hoặc false)',
    example: true,
    required: false,
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Số điện thoại của người dùng (tùy chọn)',
    example: '+84987654321',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Liên kết mạng xã hội (URL) (tùy chọn)',
    example: 'https://www.facebook.com/johndoe',
    required: false,
  })
  socialMedia?: string;
}
