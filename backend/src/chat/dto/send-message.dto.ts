import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: 'El contenido es requerido' })
  @MinLength(1, { message: 'El contenido no puede estar vacío' })
  @MaxLength(1000, { message: 'El contenido no puede tener más de 1000 caracteres' })
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
