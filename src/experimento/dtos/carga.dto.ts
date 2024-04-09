import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
} from 'class-validator';

export class CreateCargaDto {
    @IsNotEmpty()
    @IsString()
    @IsPositive()
    @ApiProperty()
    readonly cantidad_usuarios: string;
    @IsNotEmpty()
    @IsString()
    @IsPositive()
    @ApiProperty()
    readonly duracion_picos: string;
    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty()
    readonly con_picos: boolean;
}

export class UpdateCargaDto extends PartialType(CreateCargaDto) { }
