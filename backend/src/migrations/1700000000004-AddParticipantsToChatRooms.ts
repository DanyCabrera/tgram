import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddParticipantsToChatRooms1700000000004 implements MigrationInterface {
  name = 'AddParticipantsToChatRooms1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna participants a la tabla chat_rooms
    await queryRunner.addColumn(
      'chat_rooms',
      new TableColumn({
        name: 'participants',
        type: 'text',
        isArray: true,
        default: "'{}'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar columna participants de la tabla chat_rooms
    await queryRunner.dropColumn('chat_rooms', 'participants');
  }
}
