import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Request, Response } from 'express';
import { Public } from '../../cores/decorators/public.decorator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { TokenResponse } from './dto/token-respone';
import { SuccessResponse } from '../../cores/respones/success.respone';
import { User } from '../users/entities/user.entity';
import { Actions } from 'src/cores/decorators/action.decorator';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';

@Controller('auth')
@ApiBearerAuth()
@ApiTags('Auth')
@ApiSecurity('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  /**
   * Create a new user (done)
   */
  @Public()
  @Post('signup')
  @ApiCreatedResponse({
    description:
      "Return token pair access token, refresh token with expired time of AT and user'roles",
    type: TokenResponse,
  })
  @ApiBadRequestResponse({ description: 'Email must be an email' })
  @ApiForbiddenResponse({ description: 'User is registered' })
  signUp(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(registerDto);
  }

  /**
   * client click confirm email (fix)
   * 
   */

  @Public()
  @Get('confirm-email')
  async confirmEmail(@Query('tokenOTP') tokenOTP: string) {
    return this.authService.verifyEmailToken(tokenOTP);
  }
  /**
   * Client do action login (done)
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOkResponse({
    description:
      "Return token pair access token, refresh token with expired time of AT and user'roles",
    type: TokenResponse,
  })
  @ApiBadRequestResponse({ description: 'Email must be an email' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'invalid credentials' })
  async login(@Body() login: LoginDto, @Res() res: Response) {
    return new SuccessResponse({
      message: 'Login success',
      metadata: await this.authService.login(login as User),
    }).send(res);
  }

  /**
   * Client request new access token by refresh token (done)
   */
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
        },
      },
    },
  })
  @ApiOkResponse({
    description:
      "Return token pair access token, refresh token with expired time of AT and user'roles",
    type: TokenResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('refresh')
  @Actions('create')
  @Objectcode('AUTH01')
  generateAccessToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.requestAccessToken(refreshToken);
  }

  /**
   * Client forgot password (done)
  */
  @Public()
  @Post('forgot-password')
  @ApiOkResponse({ description: 'OTP has been sent to email if it exists' })
  @ApiBadRequestResponse({ description: 'Invalid email format' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'user@example.com',
          description: 'User email to receive the OTP',
        },
      },
    },
  })  
  async forgotPassword(@Body('email') email: string, @Res() res: Response) {
    if (!email) {
      return new SuccessResponse({
        message: 'Invalid email format',
        metadata: null, // Thêm metadata để tránh lỗi TypeScript
      }).send(res);
    }
  
    await this.authService.forgotPassword(email);
  
    return new SuccessResponse({
      message: 'If the email exists, an OTP has been sent to reset the password',
      metadata: null, // Thêm metadata để phù hợp với kiểu yêu cầu
    }).send(res);
  }
  
  /**
   * Client do action logout (done)
   */
  @Get('logout')
  @Actions('read')
  @Objectcode('AUTH01')
  @ApiOkResponse({ description: 'Logout successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  logout(@Req() req: Request) {
    const { userId } = req.user as any;

    return this.authService.logout(userId);
  }
}
