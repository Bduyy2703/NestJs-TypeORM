import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Token } from '../token/entities/token.entity';
import { RoleService } from '../role/role.service';
@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService,
    private roleService: RoleService
  ) { }

  async create(registerDto: RegisterDto, tokenOTP: string): Promise<User> {

    const [firstname, lastname] = registerDto.username.split(' ');

    // Tìm kiếm role dựa trên tên role
    const role = await this.roleService.findByName(registerDto.roleName ? registerDto.roleName : 'USER');
    if (!role) {
      throw new Error("Role không hợp lệ");  // Kiểm tra nếu không tìm thấy role
    }

    const newUser = await this.prismaService.user.create({
      data: {
        email: registerDto.email,
        password: registerDto.password,
        username: registerDto.username,
        isVerified: false,
        tokenOTP: tokenOTP,
        roleId: role.id,
        profile: {
          create: {
            phoneNumber: registerDto.phoneNumber,
            firstName: firstname,
            lastName: lastname,
          },
        },
      },
      include: {
        role: true,
      },
    });
    return newUser;
  }

  async findAll(): Promise<User[]> {
    return await this.prismaService.user.findMany();
  }

  async findOneById(id: string): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: { id }, include: {
        role: true,
      },
    });
  }

  async findOneByEmail(email: string): Promise<User> {

    const user = await this.prismaService.user.findUnique({
      where: { email }, include: {
        role: true, // Tải quan hệ role
      },
    });
    return user;
  }

  async findUserByToken(tokenOTP: string): Promise<User> {

    const user = await this.prismaService.user.findFirst({ where: { tokenOTP } });
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

  async updateUser(user: User): Promise<User> {
    // Kiểm tra xem người dùng có tồn tại trong DB hay không
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Thực hiện cập nhật
    return await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isVerified: user.isVerified, // true
        tokenOTP: user.tokenOTP,     // null
      },
    });
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
