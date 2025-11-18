import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SolicitudAlimentoDto {
  @IsString() @IsNotEmpty() uid: string;
  @IsString() @IsNotEmpty() nombre: string;
  @IsString() @IsNotEmpty() apellidoPaterno: string;
  @IsString() @IsNotEmpty() apellidoMaterno: string;
  @IsString() @IsNotEmpty() correo: string;
  @IsString() @IsOptional() telefono?: string;

  @IsOptional() @IsString() tipoBeneficiario?: string;
  @IsOptional() @IsString() nombreBeneficiario?: string;
  @IsOptional() @IsString() curpRfcBeneficiario?: string;

  @IsOptional() @IsString() calle?: string;
  @IsOptional() @IsString() numExterior?: string;
  @IsOptional() @IsString() numInterior?: string;
  @IsOptional() @IsString() colonia?: string;
  @IsOptional() @IsString() codigoPostal?: string;
  @IsOptional() @IsString() municipio?: string;
  @IsOptional() @IsString() estado?: string;
  @IsOptional() @IsString() referencias?: string;

  @IsArray() @IsNotEmpty() tipoAlimentos: string[];
  @IsOptional() @IsString() donadorAsignado?: string;
  @IsString() @IsNotEmpty() cantidad: string;
  @IsString() @IsNotEmpty() frecuencia: string;
  @IsString() @IsNotEmpty() urgencia: string;
  @IsString() @IsNotEmpty() modalidad: string;

  @IsString() @IsOptional() diaPreferido?: string;
  @IsString() @IsOptional() horaPreferida?: string;
  @IsString() @IsOptional() comentarios?: string;

  @IsString() @IsOptional() estatusSolicitud?: string = 'pendiente';
}
