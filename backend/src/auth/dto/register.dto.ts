// DTOs (Data transfer objects) 
// lo recomienda NestJS para definir la forma que reciben los datos de las peticiones del cliente(frontend)
// y para aplicar validaciones y transformaciones a esos datos.

// class-validator: librería que proporciona decoradores y funciones para validar objetos de JavaScript/TypeScript.
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellidoPaterno: string;

    @IsString()
    @IsNotEmpty()
    apellidoMaterno: string;

    @IsEmail()
    @IsNotEmpty()
    correo: string;

    @Matches(/^\d{10,15}$/)
    telefono: string;

    @MinLength(6)
    pass1: string;

    @IsString()
    @IsNotEmpty()
    tipoUsuario: string;
}