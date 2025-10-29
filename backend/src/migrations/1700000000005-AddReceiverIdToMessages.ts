import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReceiverIdToMessages1700000000005 implements MigrationInterface {
  name = 'AddReceiverIdToMessages1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna receiverId a la tabla messages
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'receiverId',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar columna receiverId de la tabla messages
    await queryRunner.dropColumn('messages', 'receiverId');
  }
}
