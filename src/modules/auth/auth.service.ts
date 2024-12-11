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

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private tokenService: TokenService,
    private mailerService: MailService,
    private eventEmitter2: EventEmitter2,
  ) { }

  async signUp(registerDto: RegisterDto) {
    // 1. Checking exist email ?
    const user = await this.usersService.findOneByEmail(registerDto.email);

    if (user) {
      throw new ForbiddenException('User is registered !');
    }

    // 2. hashing password
    registerDto.password = await bcrypt.hash(registerDto.password, 10);
    // 3. create
    const newUser = await this.usersService.create(registerDto);

    if (!newUser) {
      throw new BadRequestException("Can't register !");
    }

    // 4. generate accessToken and refreshToken using JWT
    const payload = {
      userId: newUser.id,
      email: newUser.email,
      roles: newUser.roles,
    };

    const { accessToken, refreshToken, expiredInAccessToken } =
      await this.createTokenPair(payload);

    await this.tokenService.create(newUser, {
      accessToken,
      refreshToken,
    });

    // Send email
    const token = Math.floor(1000 + Math.random() * 9000).toString();

    await this.mailerService.sendUserConfirmation(newUser, token);

    return {
      accessToken,
      refreshToken,
      expiredInAccessToken,
    };
  }

  async login(user: User) {
    // generate access token and refresh token
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };
    const { accessToken, refreshToken, expiredInAccessToken } =
      await this.createTokenPair(payload);
    await this.tokenService.create(user, {
      refreshToken: refreshToken,
      accessToken: accessToken,
    });
    console.log('333333')
    return {
      accessToken,
      refreshToken,
      expiredInAccessToken,
    };
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

    const holderUser = await this.usersService.findOneById(holderToken.userId);

    // 4. generate new access
    const payload = {
      userId: holderUser.id,
      email: holderUser.email,
      roles: holderUser.roles,
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
