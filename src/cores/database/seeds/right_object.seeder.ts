import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { RightObject } from '../../../modules/right_object/entities/t_right_object';
import { Right } from '../../../modules/right/entities/t_right';
import { Object_entity } from '../../../modules/object/entities/object.entity';

export class RightObjectSeeder implements Seeder {
    async run(dataSource: DataSource): Promise<void> {
        const rightObjectRepository = dataSource.getRepository(RightObject);
        const rightRepository = dataSource.getRepository(Right);
        const objectRepository = dataSource.getRepository(Object_entity);

        const count = await rightObjectRepository.count();
        if (count > 0) {
            console.log('⚠️ RightObject already seeded. Skipping...');
            return;
        }

        const rights = await rightRepository.find();
        const objects = await objectRepository.find();

        if (rights.length === 0 || objects.length === 0) {
            console.log('⚠️ No rights or objects found. Make sure they are seeded first!');
            return;
        }

        const seedData = [
            // admin
            {
                rightId: rights[0].id,
                objectId: objects[0].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                rightId: rights[0].id,
                objectId: objects[1].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                rightId: rights[0].id,
                objectId: objects[2].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                rightId: rights[0].id,
                objectId: objects[3].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                rightId: rights[0].id,
                objectId: objects[4].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                rightId: rights[0].id,
                objectId: objects[7].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },

            //user
            {
                rightId: rights[2].id,
                objectId: objects[5].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                rightId: rights[2].id,
                objectId: objects[6].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },
            {
                rightId: rights[2].id,
                objectId: objects[7].id,
                createYn: true,
                readYn: true,
                updateYn: true,
                deleteYn: true,
                executeYn: true,
                createdDate: new Date(),
                createdBy: 'admin',
                updatedDate: new Date(),
                updatedBy: 'admin',
                isActive: true,
            },

        ];

        await rightObjectRepository.insert(seedData);
        console.log('✅ Seed data for RightObject inserted successfully!');
    }
}
