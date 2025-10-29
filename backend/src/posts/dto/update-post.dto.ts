import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El contenido no puede estar vacío' })
  @MaxLength(2000, { message: 'El contenido no puede tener más de 2000 caracteres' })
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}
