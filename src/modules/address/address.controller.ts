import {
    Controller,
    Post,
    Body,
    Req,
    BadRequestException,
    Put,
    Param,
    Delete,
    Get,
    Query,
    Patch,
    ParseBoolPipe
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { Public } from '../../cores/decorators/public.decorator';
import { Actions } from 'src/cores/decorators/action.decorator';
import { Objectcode } from 'src/cores/decorators/objectcode.decorator';
import { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
    user?: User;
}

@ApiTags('Address')
@Controller('addresses')
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    // create Address
    @Post()
    @Actions('create')
    @Objectcode('AD01')
    @ApiOperation({ summary: 'Create a new address' })
    @ApiBody({ type: CreateAddressDto })
    @ApiBearerAuth()
    async createAddress(@Body() createAddressDto: CreateAddressDto, @Req() req: RequestWithUser) {
        const userId = req.user.id;
        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }

        return this.addressService.create(createAddressDto, userId);
    }


    // update address by id address
    @Put(':id')
    async updateAddress(
        @Param('id') id: number,
        @Body() updateAddressDto: CreateAddressDto,
        @Req() req: RequestWithUser
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('Người dùng không xác thực');
        }

        const address = await this.addressService.findOne(id);
        if (!address || address.user.id !== userId) {
            throw new BadRequestException('Địa chỉ không tồn tại hoặc không thuộc về bạn');
        }

        return this.addressService.update(id, updateAddressDto);
    }


    // delete address by id address

    @Delete(':id')
    async deleteAddress(@Param('id') id: number, @Req() req: RequestWithUser) {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('Người dùng không xác thực');
        }

        const address = await this.addressService.findOne(id);
        if (!address || address.user.id !== userId) {
            throw new BadRequestException('Địa chỉ không tồn tại hoặc không thuộc về bạn');
        }

        return this.addressService.remove(id);
    }

    // Get all addresses by userId
    @Get('/all')
    @ApiOperation({ summary: 'Get all addresses of the authenticated user' })
    @ApiBearerAuth()
    async getAllAddresses(@Req() req: RequestWithUser) {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('Người dùng không xác thực');
        }

        return this.addressService.findAllByUserId(userId);
    }

    // Search addresses by query (street, city, country)
    @Get('search')
    @ApiOperation({ summary: 'Search addresses' })
    @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query' })
    async searchAddresses(@Query('q') query: string, @Req() req: RequestWithUser) {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('Người dùng không xác thực');
        }

        return this.addressService.search(userId, query);
    }

    // update default for address 
    @Patch(':id/default')
    async updateIsDefault(
        @Param('id') id: number,
        @Req() req: RequestWithUser,
        @Query('isDefault',ParseBoolPipe) isDefault: boolean
    ) {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('Người dùng không xác thực');
        }

        const address = await this.addressService.findOne(id);
        if (!address || address.user.id !== userId) {
            throw new BadRequestException('Địa chỉ không tồn tại hoặc không thuộc về bạn');
        }

        if (isDefault) {
            await this.addressService.resetDefaultAddress(userId);
        }
        return this.addressService.updatePartial(id, { isDefault });
    }
}