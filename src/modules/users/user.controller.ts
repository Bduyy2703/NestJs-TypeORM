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
  import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
  import { Role } from '../../common/enums/env.enum';
  import { Roles } from '../../cores/decorators/roles.decorator';
  import { Request } from 'express';
  import { UpdatePasswordDto } from '../users/dto/update-password.dto';
  import { ResetPasswordDto } from './dto/reset-password.dto';
  
  @Controller('users')
  @ApiTags('Users')
  @ApiSecurity('JWT-auth')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    /**
     * [ADMIN] Get all users
     */
    @Get()
    @Roles(Role.ADMIN)
    async findAll() {
      return await this.usersService.findAll();
    }
  
    /**
     * [ADMIN] Get user by user id
     */
    @Get(':id')
    @Roles(Role.ADMIN)
    async findOneById(@Param('id') id: string) {
      return await this.usersService.findOneById(id);
    }
  
    /**
     * [USER] can change own password
     */
    @Patch('me/password')
    @Roles(Role.USER)
    @ApiOkResponse({
      schema: {
        example: {
          message: 'Password successfully updated',
        },
      },
    })
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
    @Patch(':id/password')
    @Roles(Role.ADMIN)
    @ApiOkResponse({ type: ResetPasswordDto })
    changePassword(@Param('id') id: string) {
      return this.usersService.resetPassword(id);
    }
  
    /**
     * [ADMIN] can delete user
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    delete(@Param('id') id: string) {
      return this.usersService.deleteById(id);
    }
  }
  