import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
    IsArray,
    IsNotEmpty,
} from 'class-validator';

export class CreateCargaDto {
    @IsNotEmpty()
    @IsArray()
    @ApiProperty()
    readonly cant_usuarios: string[];
    @IsNotEmpty()
    @IsArray()
    @ApiProperty()
    readonly duracion_picos: string[];
}

export class UpdateCargaDto extends PartialType(CreateCargaDto) { }
