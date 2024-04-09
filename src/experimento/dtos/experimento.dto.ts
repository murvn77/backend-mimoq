import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
export class CreateExperimentoDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly duracion: string;
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly cantidad_replicas: number;
  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  readonly endpoints: string[];
  @IsNotEmpty({ message: 'La FL del despliegue es obligatoria' })
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly fk_id_despliegue: number;
  @IsNotEmpty({ message: 'La FK del experimento es obligatoria' })
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly fk_id_metrica: number;
  @IsNotEmpty({ message: 'La FK de la carga es obligatoria' })
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly fk_id_carga: number;
}

export class UpdateExperimentoDto extends PartialType(CreateExperimentoDto) {}
