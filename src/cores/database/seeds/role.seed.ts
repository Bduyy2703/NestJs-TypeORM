import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '../../../modules/role/entities/t_role';

export class RoleSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        const roleRepository = dataSource.getRepository(Role);

        const count = await roleRepository.count();
        if (count > 0) {
            console.log('⚠️ Roles already seeded. Skipping...');
            return;
        }

        const roles = [
            {
                code: 'ADMIN',
                name: 'Admin',
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system',
                isActive: true,
            },
            {
                code: 'USER',
                name: 'User',
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system',
                updatedBy: 'system',
                isActive: true,
            },

        ];

        await roleRepository.insert(roles);
        console.log('✅ Seed data for Role inserted successfully!');
    }
}
