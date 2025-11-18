// DTOs (Data transfer objects) 
// lo recomienda NestJS para definir la forma que reciben los datos de las peticiones del cliente(frontend)
// y para aplicar validaciones y transformaciones a esos datos.

// class-validator: librería que proporciona decoradores y funciones para validar objetos de JavaScript/TypeScript.
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString() @IsNotEmpty() nombre: string;
  @IsString() @IsNotEmpty() apellidoPaterno: string;
  @IsString() @IsNotEmpty() apellidoMaterno: string;
  @IsEmail() @IsNotEmpty() correo: string;
  @Matches(/^\d{10,15}$/) telefono: string;
  @MinLength(6) pass1: string;
  @IsString() @IsNotEmpty() tipoUsuario: string;

  // Campos beneficiario opcionales
  @IsOptional() @IsString() tipoBeneficiario?: string;
  @IsOptional() @IsString() nombreBeneficiario?: string;
  @IsOptional() @IsString() curpRfcBeneficiario?: string;

  // Campos donador opcionales
  @IsOptional() @IsString() tipoDonador?: string;
  @IsOptional() @IsString() nombreEmpresa?: string;
  @IsOptional() @IsString() rfcEmpresa?: string;
  @IsOptional() @IsString() nombreRepresentante?: string;
  @IsOptional() @IsString() cargoRepresentante?: string;
  @IsOptional() @IsString() contactoAlterno?: string;
  @IsOptional() @IsString() correoAlterno?: string;

  // Dirección opcional para ambos
  @IsOptional() @IsString() calle?: string;
  @IsOptional() @IsString() numExterior?: string;
  @IsOptional() @IsString() numInterior?: string;
  @IsOptional() @IsString() colonia?: string;
  @IsOptional() @IsString() codigoPostal?: string;
  @IsOptional() @IsString() municipio?: string;
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() referencias?: string;
}
