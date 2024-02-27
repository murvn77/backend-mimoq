import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
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
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_usuario: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

