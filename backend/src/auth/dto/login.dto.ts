import { IsEmail, IsNotEmpty, IsString, IsOptional} from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "El correo debe ser un email válido" })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: "La contraseña no puede estar vacía" })
  password: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "El rol no puede estar vacío" })
  rolSeleccionado?: string;
}