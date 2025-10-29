import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'El contenido es requerido' })
  @MinLength(1, { message: 'El contenido no puede estar vacío' })
  @MaxLength(500, { message: 'El contenido no puede tener más de 500 caracteres' })
  content: string;
}
