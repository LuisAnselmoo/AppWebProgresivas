// DTOs (Data transfer objects) 
// lo recomienda NestJS para definir la forma que reciben los datos de las peticiones del cliente(frontend)
// y para aplicar validaciones y transformaciones a esos datos.

// class-validator: librería que proporciona decoradores y funciones para validar objetos de JavaScript/TypeScript.
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEmail,
  IsDateString,
  IsNumber,
  Matches
} from 'class-validator';

export class SolicitudDonacionDto {
  @IsString() @IsNotEmpty() uid: string;
  @IsString() @IsNotEmpty() nombre: string;
  @IsString() @IsNotEmpty() apellidoPaterno: string;
  @IsString() @IsNotEmpty() apellidoMaterno: string;
  @IsEmail() @IsNotEmpty() correo: string;
  @Matches(/^\d{10,15}$/) telefono: string;

  // Campos donador opcionales
  @IsOptional() @IsString() nombreEmpresa?: string;
  @IsOptional() @IsString() rfcEmpresa?: string;

  @IsOptional() @IsString() nombreRepresentante?: string;
  @IsOptional() @IsString() cargoRepresentante?: string;
  @IsOptional() @IsString() contactoAlterno?: string;
  @IsOptional() @IsString() correoAlterno?: string;

  // Detalles de la donación
  @IsArray() @IsNotEmpty() productos: {
    nombre: string;
    categoria: string;
    cantidad: number;
    unidad: string;
    perecedero: boolean;
    fechaCaducidad?: string;
    observaciones?: string;
  }[];

  @IsString() @IsNotEmpty() modalidad: string; 
  @IsDateString() @IsOptional() fechaRecoleccion?: string;
  @IsString() @IsOptional() horaRecoleccion?: string;
  @IsOptional() @IsString() beneficiarioAsignado?: string;
  @IsString() @IsOptional() comentarios?: string;

  @IsString() @IsOptional() estatusDonacion?: string = 'pendiente';
  @IsDateString() @IsOptional() fechaRegistro?: string = new Date().toISOString();

  @IsOptional() @IsString() calle?: string;
  @IsOptional() @IsString() numExterior?: string;
  @IsOptional() @IsString() numInterior?: string;
  @IsOptional() @IsString() colonia?: string;
  @IsOptional() @IsString() codigoPostal?: string;
  @IsOptional() @IsString() municipio?: string;
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() referencias?: string;
}
