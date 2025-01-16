import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Tên đầu tiên của người dùng',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Họ của người dùng',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Số điện thoại của người dùng',
    example: '+84987654321',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Liên kết mạng xã hội (URL)',
    example: 'https://www.facebook.com/johndoe',
    required: false,
  })
  socialMedia?: string;

  @ApiProperty({
    description: 'Trạng thái kích hoạt hồ sơ (true hoặc false)',
    example: true,
    required: false,
  })
  isActive?: Boolean;
}
