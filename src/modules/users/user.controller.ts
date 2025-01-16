import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { ApiBody, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/enums/env.enum';
import { Roles } from '../../cores/decorators/roles.decorator';
import { Request } from 'express';
import { UpdatePasswordDto } from '../users/dto/update-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Actions } from 'src/cores/decorators/action.decorator';

@Controller('users')
@ApiTags('Users')
@ApiSecurity('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * [ADMIN] Get all users
   */
  @Get('all')
  @Actions('read')
  @Roles(Role.ADMIN)
  async findAll() {
    return await this.usersService.findAll();
  }

  /**
   * [ADMIN] Get user by user id
   */
  @Get(':id')
  @Actions('read')
  @Roles(Role.ADMIN)
  async findOneById(@Param('id') id: string) {
    return await this.usersService.findOneById(id);
  }

  /**
   * [USER] can change own password
   */
  @Patch('me/change-password')
  @Roles(Role.USER)
  @Actions('execute')
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }

  /**
   * [ADMIN] can reset password of user
   */
  @Patch(':id/reset-password')
  @Roles(Role.ADMIN)
  @Actions('update')
  @ApiOkResponse({ type: ResetPasswordDto })
  changePassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }

  /**
   * [ADMIN] can delete user
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @Actions('delete')
  delete(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }
}
