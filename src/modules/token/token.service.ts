import { Injectable } from '@nestjs/common';
import { SaveTokenDto } from './dto/save-token.dto';
import { UsersService } from '../users/user.service';
import { PrismaService } from 'prisma/prisma.service';
import { Token, User } from '@prisma/client';

@Injectable()
export class TokenService {
  constructor(
    private prismaService: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(user: User, saveTokenDto: SaveTokenDto) {
    // const foundedUser = await this.usersService.findOneById(user.id);

    // if (!foundedUser) throw new BadRequestException('User not found !');

    let token = await this.prismaService.token.findUnique({
      where: { userId: user.id },
    });

    if (token) {
      token = {
        ...token,
        ...saveTokenDto,
      };
    } else {
      token = await this.prismaService.token.create({
        data: { ...saveTokenDto, userId: user.id },
      });
    }

    return await this.prismaService.token.upsert({
      where: { id: token.id },
      update: { ...token },
      create: { ...token },
    });
  }

  async update(token: Token) {
    return await this.prismaService.token.update({
      where: { id: token.id },
      data: { ...token },
    });
  }

  async findByRefreshTokenUsed(refreshToken: string): Promise<Token> {
    return await this.prismaService.token.findFirst({
      where: {
        refreshTokenUsed: { hasSome: [refreshToken] },
      },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<Token | null> {
    return await this.prismaService.token.findFirst({
      where: { refreshToken },
    });
  }

  async findAccessToken(accessToken: string): Promise<Token | null> {
    return await this.prismaService.token.findFirst({
      where: { accessToken },
    });
  }

  async deleteByUserId(userId: string): Promise<Token> {
    return await this.prismaService.token.delete({ where: { userId } });
  }
}
