import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../users/entities/user.entity';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../address/entity/address.entity';
@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,) { }

  async findAll(): Promise<Profile[]> {
    return await this.profileRepository.find();
  }

  async findByUsername(username: string): Promise<Profile> {
    return await this.profileRepository.findOne({
      where: { user: { username } },
      relations: ['user'], // Load thêm thông tin từ bảng user
    });
  }

  async findByUserId(userId: string): Promise<Profile> {
    return await this.profileRepository.findOne({
      where: { userId },
    });
  }

  async getMe(userId: string): Promise<Profile & { email: string; defaultAddress: Address | null }> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ["user", "user.addresses"],
    });
  
    if (!profile) {
      throw new NotFoundException("Không tìm thấy hồ sơ người dùng");
    }
  
    return {
      ...profile,
      email: profile.user.email, // Thêm email của user
      defaultAddress: profile.user.addresses.find(addr => addr.isDefault) || null, // Lấy địa chỉ mặc định
    };
  }
  

  async update(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const username = `${updateProfileDto.firstName || ''}${updateProfileDto.lastName || ''}`.trim(); // Tạo username từ firstName và lastName

    console.log('Generated username:', username);

    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    await this.userRepository.update(
      { id: userId },
      { username }, // Cập nhật username trong bảng User
    );

    await this.profileRepository.update(
      { userId },
      updateProfileDto, // Cập nhật các trường trong bảng Profile
    );

    // Trả về profile đã được cập nhật
    return await this.findByUserId(userId);
  }

}
