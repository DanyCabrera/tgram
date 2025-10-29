import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @IsString({ message: 'La contraseña es requerida' })
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}
