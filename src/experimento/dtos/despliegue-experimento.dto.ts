import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
    IsNotEmpty,
    IsNumber,
    IsPositive,
} from 'class-validator';

export class CreateDespliegueExperimentoDto {
    @IsNotEmpty({ message: 'La fk del experimento es obligatoria' })
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_id_experimento: number;
    @IsNotEmpty({ message: 'La fk del despliegue es obligatoria' })
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_id_despliegue: number;
}

export class UpdateDespliegueExperimentoDto extends PartialType(CreateDespliegueExperimentoDto) { }
