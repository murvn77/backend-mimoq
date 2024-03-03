import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class CreateUsuarioDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly nombre: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly correo: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly documento: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly contrasena: string;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
