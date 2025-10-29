import { IsArray, IsString, IsOptional, IsBoolean, ArrayMinSize } from 'class-validator';

export class CreateChatRoomDto {
  @IsArray({ message: 'Los participantes son requeridos' })
  @ArrayMinSize(1, { message: 'Debe haber al menos un participante' })
  participantIds: string[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;
}
