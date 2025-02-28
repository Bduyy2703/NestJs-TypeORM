import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Right } from '../../../modules/right/entities/t_right';

export class RightSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        const rightRepository = dataSource.getRepository(Right);

        const count = await rightRepository.count();
        if (count > 0) {
            console.log('⚠️ Rights already seeded. Skipping...');
            return;
        }

        const seedData = [
            {
                code: 'ADMIN01',
                name: 'Write',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'USER01',
                name: 'View',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                code: 'USER02',
                name: 'Write',
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
        ];

        await rightRepository.insert(seedData);
        console.log('✅ Seed data for Right inserted successfully!');
    }
}
