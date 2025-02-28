import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { RoleRight } from '../../../modules/role_right/entities/t_role_right';
import { Role } from '../../../modules/role/entities/t_role';
import { Right } from '../../../modules/right/entities/t_right';

export class RoleRightSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        const roleRightRepository = dataSource.getRepository(RoleRight);
        const roleRepository = dataSource.getRepository(Role);
        const rightRepository = dataSource.getRepository(Right);


        const count = await roleRightRepository.count();
        if (count > 0) {
            console.log('⚠️ RoleRight already seeded. Skipping...');
            return;
        }

        const roles = await roleRepository.find();
        const rights = await rightRepository.find();

        if (roles.length === 0 || rights.length === 0) {
            console.log('⚠️ No roles or rights found. Make sure they are seeded first!');
            return;
        }

        const seedData = [
            {
                role: roles[0],
                right: rights[0],
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
        ];

        await roleRightRepository.insert(seedData);
        console.log('✅ Seed data for RoleRight inserted successfully!');
    }
}
