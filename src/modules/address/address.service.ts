import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entity/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    async create(createAddressDto: CreateAddressDto, userId: string): Promise<Address> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const address = this.addressRepository.create({ ...createAddressDto, user });
        return this.addressRepository.save(address);
    }
    async update(id: number, updateAddressDto: CreateAddressDto) {
        await this.addressRepository.update(id, updateAddressDto);
        return this.addressRepository.findOne({ where: { id } });
    }

    async remove(id: number) {
        return this.addressRepository.delete(id);
    }
    async findOne(id: number) {
        return this.addressRepository.findOne({
            where: { id },
            relations: ['user'], // Đảm bảo lấy cả thông tin User để kiểm tra quyền sở hữu
        });
    }

    async findAllByUserId(userId: string) {
        return this.addressRepository.find({
            where: { user: { id: userId } },
        });
    }
    
    async search(userId: string, query: string) {
        return this.addressRepository.createQueryBuilder('address')
            .where('address.userId = :userId', { userId })
            .andWhere(
                '(address.street LIKE :query OR address.city LIKE :query OR address.country LIKE :query)',
                { query: `%${query}%` }
            )
            .getMany();
    }
    async resetDefaultAddress(userId: string): Promise<void> {
        await this.addressRepository.update({ user: { id: userId } }, { isDefault: false });
    }
    async updatePartial(id: number, partialData: Partial<Address>): Promise<Address> {
        await this.addressRepository.update(id, partialData);
        return this.addressRepository.findOne({ where: { id } });
    }
}
