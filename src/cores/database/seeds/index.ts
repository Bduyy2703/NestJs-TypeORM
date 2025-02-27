import AppDataSource from '../config/data-source'; // Import DataSource
import { runSeeder } from 'typeorm-extension';
import { MainSeeder } from './main.seeder';

(async () => {
  try {
    console.log('🔄 Initializing Database...');
    await AppDataSource.initialize();
    console.log('✅ Database Connected!');

    await runSeeder(AppDataSource, MainSeeder);

    console.log('🎉 Seeding Completed!');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
})();
