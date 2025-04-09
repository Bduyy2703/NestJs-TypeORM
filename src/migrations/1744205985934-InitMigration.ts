import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1744205985934 implements MigrationInterface {
    name = 'InitMigration1744205985934'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice_item" DROP CONSTRAINT "FK_bb4dbf923e241f36e93b98c6947"`);
        await queryRunner.query(`ALTER TABLE "invoice_item" ADD CONSTRAINT "FK_bb4dbf923e241f36e93b98c6947" FOREIGN KEY ("productDetailId") REFERENCES "product_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice_item" DROP CONSTRAINT "FK_bb4dbf923e241f36e93b98c6947"`);
        await queryRunner.query(`ALTER TABLE "invoice_item" ADD CONSTRAINT "FK_bb4dbf923e241f36e93b98c6947" FOREIGN KEY ("productDetailId") REFERENCES "product_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
