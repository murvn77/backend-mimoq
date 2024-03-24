import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
  IsArray,
  IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
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
    @IsOptional()
    @IsString()
    @ApiProperty()
    readonly url_proyecto: string;
    @IsOptional()
    @IsArray()
    @ApiProperty()
    readonly urls_proyecto: string[];
    @IsOptional()
    @IsArray()
    @ApiProperty()
    readonly nombres_proyecto: string[];
    @IsOptional()
    @IsBoolean()
    @ApiProperty()
    readonly docker_compose: boolean;
    @IsOptional()
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

