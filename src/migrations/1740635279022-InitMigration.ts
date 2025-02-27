import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1740635279022 implements MigrationInterface {
    name = 'InitMigration1740635279022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "object_entity" DROP CONSTRAINT "UQ_492d3c96261431a899e894a8088"`);
        await queryRunner.query(`ALTER TABLE "object_entity" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "object_entity" ADD "code" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "object_entity" ADD CONSTRAINT "UQ_492d3c96261431a899e894a8088" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "object_entity" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "object_entity" ADD "name" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "right" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "right" ADD "code" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "right" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "right" ADD "name" character varying(30)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "right" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "right" ADD "name" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "right" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "right" ADD "code" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "object_entity" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "object_entity" ADD "name" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "object_entity" DROP CONSTRAINT "UQ_492d3c96261431a899e894a8088"`);
        await queryRunner.query(`ALTER TABLE "object_entity" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "object_entity" ADD "code" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "object_entity" ADD CONSTRAINT "UQ_492d3c96261431a899e894a8088" UNIQUE ("code")`);
    }

}
