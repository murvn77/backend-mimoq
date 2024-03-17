import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
  IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
} from 'class-validator';

export class CreateProjectDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly titulo: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly descripcion: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly url_proyecto: string;
    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty()
    readonly docker_compose: boolean;
    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty()
    readonly dockerfile: boolean;
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_usuario: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

