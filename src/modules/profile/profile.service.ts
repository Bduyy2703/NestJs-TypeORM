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
    return await this.prismaService.profile.update({
      where: { userId },
      data: {
        ...updateProfileDto,
      },
    });
  }

  async updateSome(userId: string, updateProfileDto: UpdateProfileDto) {
    return await this.prismaService.profile.update({
      where: { userId },
      data: {
        ...updateProfileDto,
      },
    });
  }
}
