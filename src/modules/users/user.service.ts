import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const user = await this.prismaService.user.create({
      data: {
        ...registerDto,
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.prismaService.user.findMany();
  }

  async findOneById(id: string): Promise<User> {
    return await this.prismaService.user.findUnique({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    return user;
  }

  async resetPassword(id: string): Promise<any> {
    const user = await this.findOneById(id);

    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let randomPass = '';

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      randomPass += alphabet[randomIndex];
    }

    const newPass = await bcrypt.hash(randomPass, 10);

    user.password = newPass;

    await this.prismaService.user.update({
      where: { id },
      data: { ...user },
    });

    let res = new ResetPasswordDto();
    res.message = 'Password reset successfully';
    res.newPassword = randomPass;

    return res;
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.findOneById(id);

    if (!user) {
      throw new BadRequestException('Invalid user');
    }

    const isMatched = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );

    if (!isMatched) {
      throw new BadRequestException('Wrong old password');
    }

    const newPass = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    user.password = newPass;

    try {
      await this.prismaService.user.update({
        where: { id },
        data: { ...user },
      });

      return {
        message: 'Password successfully updated',
      };
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async deleteById(id: string) {
    const deletedUser = await this.prismaService.user.delete({ where: { id } });

    if (!deletedUser) {
      throw new BadRequestException("Can't delete user");
    }

    return {
      message: 'Delete successful',
      code: HttpStatus.OK,
    };
  }
}
