import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Object_entity } from '../../../modules/object/entities/object.entity';

export class ObjectEntitySeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        const objectRepository = dataSource.getRepository(Object_entity);

        const count = await objectRepository.count();
        if (count > 0) {
            console.log('⚠️ Object entities already seeded. Skipping...');
            return;
        }

        const seedData = [
            {
                code: 'ROLE01',
                name: 'Object Role',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'RIGHT01',
                name: 'Object Right',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'OBJECT01',
                name: 'Object Oject',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'RO01',
                name: 'Object RO',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'RR01',
                name: 'Object RR',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'PROFILE01',
                name: 'Object Profile',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'AD01',
                name: 'Object address',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'AUTH01',
                name: 'Object Auth',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'USER01',
                name: 'Object User',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'BLOG01',
                name: 'Object Blog',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'CATE01',
                name: 'Object category',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'INVENTORY01',
                name: 'Object inventory',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'PRODUCT01',
                name: 'Object product',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'DISCOUNT01',
                name: 'Object discount',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'PRODUCT_DETAILS01',
                name: 'Object details',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'CART01',
                name: 'Object cart',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'SALE01',
                name: 'Object SaleStrategy',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'SHIP01',
                name: 'Object shipping',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'INVOICE01',
                name: 'Object invoice',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'PAYMENT01',
                name: 'Object payment',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'REVIEW01',
                name: 'Object review',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'NOTIFY01',
                name: 'Object notify',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'WISHLIST01',
                name: 'Object wishlist',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
        ];

        await objectRepository.insert(seedData);
        console.log('✅ Seed data for Object_entity inserted successfully!');
    }
}
