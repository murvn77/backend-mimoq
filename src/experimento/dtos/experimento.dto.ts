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
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly duracion: number;
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  readonly cantidad_usuarios: number;
  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  readonly endpoints: string[];
}

export class UpdateExperimentoDto extends PartialType(CreateExperimentoDto) {}
