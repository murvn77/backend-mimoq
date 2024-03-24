import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
    IsNotEmpty,
    IsNumber,
    IsPositive,
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
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_rol_usuario: number;
}

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
