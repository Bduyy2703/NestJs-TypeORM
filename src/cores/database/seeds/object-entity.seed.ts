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
        ];

        await objectRepository.insert(seedData);
        console.log('✅ Seed data for Object_entity inserted successfully!');
    }
}
