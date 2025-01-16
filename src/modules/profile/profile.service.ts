import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '.prisma/client';

@Injectable()
export class ProfilesService {
  constructor(private prismaService: PrismaService) {}

  async findAll() {
    return await this.prismaService.profile.findMany();
  }

  async findByUsername(username: string) {
    return await this.prismaService.profile.findFirst({
      where: { user: { username } },
    });
  }

  async findByUserId(userId: string) {
    return await this.prismaService.profile.findUnique({ where: { userId } });
  }

  async getMe(userId: string) {
    return await this.prismaService.profile.findUnique({ where: { userId } });
  }

  async update(userId: string, updateProfileDto: UpdateProfileDto) {
    const username = `${updateProfileDto.firstName || ''}${updateProfileDto.lastName || ''}`.trim(); // Tạo username từ firstName và lastName
    
    console.log('Generated username:', username);
  
    return await this.prismaService.profile.update({
      where: { userId },
      data: {
        ...updateProfileDto, // Cập nhật các trường trong bảng Profile
        user: {
          update: {
            username, // Cập nhật username trong bảng User
          },
        },
      },
    });
  }

}
