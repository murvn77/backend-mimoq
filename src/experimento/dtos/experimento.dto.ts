import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

// Experimento = carga ?
export class CreateExperimentoDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly url_proyecto: string;
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly duracion: number;
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly cantidad_usuarios: number;
}
