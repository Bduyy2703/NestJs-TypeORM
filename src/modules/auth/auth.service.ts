import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenService } from '../token/token.service';
import { MailService } from '../mail/mail.service';
import { User } from '@prisma/client';
import { UsersService } from '../users/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { userExistException } from '../../cores/exceptions/bad-request.exceptions'
import { PrismaService } from 'prisma/prisma.service';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private tokenService: TokenService,
    private mailerService: MailService,
    private eventEmitter2: EventEmitter2,
    private prismaService: PrismaService
  ) { }

  async signUp(registerDto: RegisterDto) {
    const user = await this.usersService.findOneByEmail(registerDto.email);

    if (user) {
      throw new userExistException('User is registered !');
    }

    const tokenOTP = Math.floor(1000 + Math.random() * 9000).toString();

    registerDto.password = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create(registerDto, tokenOTP);
    if (!newUser) {
      throw new BadRequestException("Can't register !");
    }

    const userWithRole = await this.prismaService.user.findUnique({
      where: { id: newUser.id },
      include: { role: true },
    });

    const payload = {
      userId: userWithRole.id,
      email: userWithRole.email,
      roles: userWithRole.role.code,
    };
    const { accessToken, refreshToken, expiredInAccessToken } =
      await this.createTokenPair(payload);

    await this.tokenService.create(newUser, {
      accessToken,
      refreshToken,
    });

    await this.mailerService.sendUserConfirmation(newUser, tokenOTP, accessToken);

    return {
      accessToken,
      refreshToken,
      expiredInAccessToken,
    };
  }

  //confirm mail
  async verifyEmailToken(tokenOTP: string) {
    // 1. Tìm token trong cơ sở dữ liệu
    const user = await this.usersService.findUserByToken(tokenOTP);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }
    // 2. Xác nhận email
    user.isVerified = true;
    user.tokenOTP = null; // Xóa token sau khi xác nhận
    await this.usersService.updateUser(user);

    return { message: 'Email verified successfully' };
  }

  //login
  async login(user: User) {
    
    const userWithRole = await this.prismaService.user.findUnique({
      where: { email: user.email },
      include: { role: true },
    });

    // generate access token and refresh token
    const payload = {
      userId: userWithRole.id,
      email: userWithRole.email,
      roles: userWithRole.role.code,
    };

    const { accessToken, refreshToken, expiredInAccessToken } = await this.createTokenPair(payload);

    if (userWithRole.isVerified) {
      await this.tokenService.create(userWithRole, {
        refreshToken: refreshToken,
        accessToken: accessToken,
      });

      return {
        accessToken,
        refreshToken,
        expiredInAccessToken,
      };

    }
    else {
      // Send email
      const tokenOTP = Math.floor(1000 + Math.random() * 9000).toString();

      await this.tokenService.create(userWithRole, {
        refreshToken: refreshToken,
        accessToken: accessToken,
      });

      await this.mailerService.sendUserConfirmation(userWithRole, tokenOTP, accessToken);

      userWithRole.tokenOTP = tokenOTP;

      await this.usersService.updateUser(userWithRole);
      return {
        message: 'Email is not verified . Please check Email to verified',
        accessToken,
        refreshToken,
        expiredInAccessToken,
      };
    }
  }

  async logout(userId: string) {
    const deletedKeyToken = await this.tokenService.deleteByUserId(userId);

    if (deletedKeyToken) {
      this.eventEmitter2.emit('logout', {
        userId,
      });

      return {
        message: 'Logout successful',
        code: HttpStatus.OK,
      };
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findOneByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...remain } = user;
      return remain as User;
    }
    return null;
  }

  async validateAccessToken(accessToken: string): Promise<boolean> {
    console.log("1233333333333333")
    const foundedToken = await this.tokenService.findAccessToken(accessToken);
    return foundedToken ? true : false;
  }

  async requestAccessToken(refreshToken: string) {
    // 1. check exist refreshToken?
    if (!refreshToken) {
      throw new BadRequestException('refreshToken missing!');
    }
    // 2. decode
    const decodeToken = await this.jwtService
      .verifyAsync(refreshToken, { secret: process.env.SECRET_KEY })
      .catch(() => {
        throw new UnauthorizedException(
          'Timeout or invalid refreshToken. Please login again!',
        );
      });

    // 3. check refreshToken is used ? By Check refreshTokenUsed in db
    const foundedTokenUsed =
      await this.tokenService.findByRefreshTokenUsed(refreshToken);

    // 3.1 available refreshToken
    if (foundedTokenUsed) {
      const { userId } = decodeToken;

      // 3.2 delete refreshToken store in db
      const deletedToken = await this.tokenService.deleteByUserId(userId);

      // 3.3 finally throw error
      throw new UnauthorizedException(
        'Something went wrong! please login again.',
      );
    }

    // 4. check this refreshToken is truly using by this user
    const holderToken =
      await this.tokenService.findByRefreshToken(refreshToken);

    if (!holderToken) {
      throw new UnauthorizedException('Invalid token or not registered');
    }

    const userWithRole = await this.prismaService.user.findUnique({
      where: { id: holderToken.userId },
      include: { role: true },
    });

    // generate access token and refresh token
    const payload = {
      userId: userWithRole.id,
      email: userWithRole.email,
      roles: userWithRole.role.code,
    };
    const { expiredInAccessToken, ...tokens } =
      await this.createTokenPair(payload);

    // 5. update old AT and push old AT to RefreshTokenUsed[]
    holderToken.refreshToken = tokens.accessToken;
    holderToken.refreshTokenUsed.push(refreshToken);

    await this.tokenService.update(holderToken);

    return {
      ...tokens,
      expiredInAccessToken,
    };
  }

  async createTokenPair(payload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.EXPIRE_AT,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.EXPIRE_AT,
    });

    const expiredInAccessToken = this.jwtService.verify(accessToken).exp;

    return {
      accessToken,
      refreshToken,
      expiredInAccessToken,
    };
  }
}
