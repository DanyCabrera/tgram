import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserTable1700000000001 implements MigrationInterface {
  name = 'FixUserTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las columnas antiguas existen
    const hasFirstName = await queryRunner.hasColumn('users', 'firstName');
    const hasLastName = await queryRunner.hasColumn('users', 'lastName');
    const hasProfileImage = await queryRunner.hasColumn('users', 'profileImage');
    
    // Si las columnas antiguas existen, migrar los datos
    if (hasFirstName && hasLastName) {
      // Migrar datos existentes: combinar firstName y lastName en name
      await queryRunner.query(`
        UPDATE "users" 
        SET "name" = CONCAT("firstName", ' ', "lastName")
        WHERE "firstName" IS NOT NULL AND "lastName" IS NOT NULL
      `);
      
      // Para usuarios que no tienen firstName o lastName, usar email como name
      await queryRunner.query(`
        UPDATE "users" 
        SET "name" = SPLIT_PART("email", '@', 1)
        WHERE "name" IS NULL
      `);
      
      // Eliminar columnas antiguas
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    }
    
    if (hasProfileImage) {
      // Migrar profileImage a avatar
      await queryRunner.query(`
        UPDATE "users" 
        SET "avatar" = "profileImage"
        WHERE "profileImage" IS NOT NULL
      `);
      
      // Eliminar columna antigua
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileImage"`);
    }
    
    // Asegurar que name sea NOT NULL
    await queryRunner.query(`
      UPDATE "users" 
      SET "name" = SPLIT_PART("email", '@', 1)
      WHERE "name" IS NULL OR "name" = ''
    `);
    
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Agregar columnas antiguas
    await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "profileImage" character varying`);
    
    // Migrar datos de vuelta (dividir name en firstName y lastName)
    await queryRunner.query(`
      UPDATE "users" 
      SET "firstName" = SPLIT_PART("name", ' ', 1),
          "lastName" = CASE 
            WHEN POSITION(' ' IN "name") > 0 
            THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
            ELSE ''
          END
    `);
    
    // Migrar avatar a profileImage
    await queryRunner.query(`
      UPDATE "users" 
      SET "profileImage" = "avatar"
      WHERE "avatar" IS NOT NULL
    `);
    
    // Hacer firstName y lastName NOT NULL
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`);
  }
}

