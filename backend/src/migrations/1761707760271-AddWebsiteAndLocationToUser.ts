import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebsiteAndLocationToUser1761707760271 implements MigrationInterface {
    name = 'AddWebsiteAndLocationToUser1761707760271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "website" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "website"`);
    }
}
