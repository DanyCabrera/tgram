import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserFollowersTable1700000000003 implements MigrationInterface {
  name = 'CreateUserFollowersTable1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear la tabla user_followers para manejar las relaciones de seguimiento
    await queryRunner.createTable(
      new Table({
        name: 'user_followers',
        columns: [
          {
            name: 'followerId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'followingId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['followerId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['followingId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_USER_FOLLOWERS_FOLLOWER',
            columnNames: ['followerId'],
          },
          {
            name: 'IDX_USER_FOLLOWERS_FOLLOWING',
            columnNames: ['followingId'],
          },
        ],
      }),
      true,
    );

    // Crear índice único para evitar duplicados
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_USER_FOLLOWERS_UNIQUE" 
      ON "user_followers" ("followerId", "followingId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_followers');
  }
}
