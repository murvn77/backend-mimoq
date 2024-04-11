import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
    IsBoolean,
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class CreateCargaDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly cant_usuarios: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly duracion_picos: string;
    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty()
    readonly con_picos: boolean;
}

export class UpdateCargaDto extends PartialType(CreateCargaDto) { }
