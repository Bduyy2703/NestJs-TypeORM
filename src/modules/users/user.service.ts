import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Token } from '../token/entities/token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleService } from '../role/role.service';
import { User } from '../users/entities/user.entity'
import { Profile } from '../profile/entities/profile.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private roleService: RoleService
  ) { }

  async create(registerDto: RegisterDto, tokenOTP: string): Promise<User> {

    const [firstname, lastname] = registerDto.username.split(' ');

    // Tìm kiếm role dựa trên tên role
    const role = await this.roleService.findByName(registerDto.roleName ? registerDto.roleName : 'USER');
    if (!role) {
      throw new Error("Role không hợp lệ");  // Kiểm tra nếu không tìm thấy role
    }
    const newUser = this.userRepository.create({
      email: registerDto.email,
      password: registerDto.password,
      username: registerDto.username,
      isVerified: false,
      tokenOTP: tokenOTP,
      role: role,
    });
    await this.userRepository.save(newUser);
    // Tạo profile gắn với user
    const profile = this.profileRepository.create({
      phoneNumber: registerDto.phoneNumber,
      firstName: firstname,
      lastName: lastname,
      userId : newUser.id,
      user: newUser, // Liên kết profile với user
    });

    await this.profileRepository.save(profile);

    // Trả về user với role (eager-load role)
    const userWithRole = await this.userRepository.findOne({
      where: { id: newUser.id },
      relations: ['role'], // Eager-load role
    });
    return userWithRole;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({ relations: ['role', 'profile'] });
  }


  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'profile'], // Lấy cả quan hệ với Role và Profile
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByToken(tokenOTP: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { tokenOTP } });

    if (!user) {
      throw new NotFoundException('User not found with the provided token');
    }

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
    await this.userRepository.update(id, { password: newPass });

    let res = new ResetPasswordDto();
    res.message = 'Password reset successfully';
    res.newPassword = randomPass;

    return res;
  }

  async updateUser(user: User): Promise<User> {
    // Kiểm tra xem người dùng có tồn tại trong DB hay không
    const existingUser = await this.userRepository.findOne({ where: { id: user.id } });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Thực hiện cập nhật
    existingUser.isVerified = user.isVerified;
    existingUser.tokenOTP = user.tokenOTP;

    return await this.userRepository.save(existingUser);
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

    try {
      await this.userRepository.update(id, { password: newPass });

      return {
        message: 'Password successfully updated',
      };
    } catch (err) {
      console.log('error nè : ', err)
      throw new BadRequestException(err);
    }
  }

  async deleteById(id: string): Promise<{ message: string; code: number }> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new BadRequestException("Unable to delete user");
    }

    return { message: 'Delete successful', code: HttpStatus.OK };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByOtp(otp: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { tokenOTP : otp },
    });
  }

  async update(user: User) {
    return this.userRepository.save(user);
  }
}
