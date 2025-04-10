import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1744269974147 implements MigrationInterface {
    name = 'InitMigration1744269974147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "keyToken" DROP CONSTRAINT "FK_82ec2cad0a6b52b1f115e22b772"`);
        await queryRunner.query(`ALTER TABLE "keyToken" ADD CONSTRAINT "FK_82ec2cad0a6b52b1f115e22b772" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "keyToken" DROP CONSTRAINT "FK_82ec2cad0a6b52b1f115e22b772"`);
        await queryRunner.query(`ALTER TABLE "keyToken" ADD CONSTRAINT "FK_82ec2cad0a6b52b1f115e22b772" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
