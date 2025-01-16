import { Controller, Get, Body, Patch, Param, Put, Req } from '@nestjs/common';
import { ProfilesService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from '../../cores/decorators/roles.decorator';
import { Role } from '../../common/enums/env.enum';
import { Request } from 'express';
import { Public } from '../../cores/decorators/public.decorator';
import { ApiSecurity, ApiTags, ApiBody } from '@nestjs/swagger';
import { Actions } from 'src/cores/decorators/action.decorator';

@Controller('profiles')
@ApiTags('Profiles')
@ApiSecurity('JWT-auth')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    /**
     * [ADMIN] can find all profiles
     */
    @Get('all')
    @Actions('read')
    @Roles(Role.ADMIN)
    async findAll() {
        return await this.profilesService.findAll();
    }

    /**
     * [ADMIN, USER] can view it's own profile
     */
    @Get('/me')
    @Actions('execute')
    @Roles(Role.ADMIN, Role.USER)
    async getMe(@Req() req: Request) {
        const { userId } = req.user as any;

        return await this.profilesService.getMe(userId);
    }

    /**
     * [VIEWER] can view others profile
     */
    @Public()
    @Get(':username')
    async findByUsername(@Param('username') username: string) {
        return await this.profilesService.findByUsername(username);
    }

    /**
     * [ADMIN, USER] update some specific info in profile
     */
    @Patch()
    @Roles(Role.ADMIN, Role.USER)
    @Actions('execute')
    async updateSome(
        @Body() updateProfileDto: UpdateProfileDto,
        @Req() req: Request,
    ) {
        const { userId } = req.user as any;

        return await this.profilesService.update(userId, updateProfileDto);
    }

    /**
     * [ADMIN, USER] update some specific info in profile
     */
    @Put()
    @Roles(Role.ADMIN, Role.USER)
    @Actions('execute')
    async update(
        @Body() updateProfileDto: UpdateProfileDto,
        @Req() req: Request,
    ) {
        const { userId } = req.user as any;

        return await this.profilesService.update(userId, updateProfileDto);
    }
}
