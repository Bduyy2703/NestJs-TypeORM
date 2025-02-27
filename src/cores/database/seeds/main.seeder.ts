import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager, runSeeder } from 'typeorm-extension';
import { RoleSeeder } from './role.seed';
import { RightSeeder } from './right.seed';
import { ObjectEntitySeeder } from './object-entity.seed';
import { RightObjectSeeder } from './right_object.seeder';
import { RoleRightSeeder } from './role-right.seed';

export class MainSeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager
  ): Promise<void> {
    console.log('🔄 Running all seeders...');

    await runSeeder(dataSource, RoleSeeder);
    await runSeeder(dataSource, RightSeeder);
    await runSeeder(dataSource, ObjectEntitySeeder);
    await runSeeder(dataSource, RightObjectSeeder);
    await runSeeder(dataSource, RoleRightSeeder);

    console.log('🎉 All seeders completed!');
  }
}
//npx ts-node -r tsconfig-paths/register src/cores/database/seeds/index.ts
