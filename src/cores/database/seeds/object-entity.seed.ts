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
                code: 'OBJ001',
                name: 'Object Product',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'OBJ002',
                name: 'Object UserInfo',
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
