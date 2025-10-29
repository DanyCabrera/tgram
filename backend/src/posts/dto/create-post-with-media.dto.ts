import { IsString, IsOptional, MinLength, MaxLength, IsArray } from 'class-validator';

export class CreatePostWithMediaDto {
  @IsString({ message: 'El contenido es requerido' })
  @MinLength(1, { message: 'El contenido no puede estar vacío' })
  @MaxLength(2000, { message: 'El contenido no puede tener más de 2000 caracteres' })
  content: string;

  @IsOptional()
  @IsArray()
  media?: Express.Multer.File[];
}
