
import { SaveTokenDto } from './dto/save-token.dto';
import { UsersService } from '../users/user.service';
import { Token } from './entities/token.entity';
import { User } from '../users/entities/user.entity';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>, // Inject Token repository
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Inject User repository
  ) {}

  async create(user: User, saveTokenDto: SaveTokenDto): Promise<Token> {
    // const foundedUser = await this.usersService.findOneById(user.id);

    // if (!foundedUser) throw new BadRequestException('User not found !');

    let token = await this.tokenRepository.findOne({ where: { user: { id: user.id } } });

    if (token) {
      token = {
        ...token,
        ...saveTokenDto,
      };
    } else {
      token = this.tokenRepository.create({
        ...saveTokenDto,
        user,
      });
    }

    return await this.tokenRepository.save(token);
  }

  async update(token: Token): Promise<Token> {
    return await this.tokenRepository.save(token);
  }

  async findByRefreshTokenUsed(refreshToken: string): Promise<Token | null> {
    return await this.tokenRepository.findOne({
      where: {
        refreshTokenUsed: Like(`%${refreshToken}%`), // Sử dụng Like để tìm trong mảng
      },
    });
  }
  async findByRefreshToken(refreshToken: string): Promise<Token | null> {
    return await this.tokenRepository.findOne({
      where: { refreshToken },
    });
  }

  async findAccessToken(accessToken: string): Promise<Token | null> {
    return await this.tokenRepository.findOne({
      where: { accessToken },
    });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found!');
  
    const deleteResult = await this.tokenRepository.delete({ user: { id: userId } });
    return deleteResult.affected > 0; // Return true if tokens were deleted
  }
}
