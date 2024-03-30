import { ApiProperty, PartialType } from '@nestjs/swagger';

import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsPositive,
    IsOptional,
    IsArray
} from 'class-validator';

export class CreateDeploymentDto {
    @IsNotEmpty()
    @IsArray()
    @ApiProperty()
    readonly cant_replicas: number[];
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly cant_pods: number;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly nombre_namespace: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly usuario_img: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    readonly nombre_img: string;
    @IsOptional()
    @IsString()
    @ApiProperty()
    readonly tag_img: string;
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_proyecto: number;
}

export class UpdateDeploymentDto extends PartialType(CreateDeploymentDto) {}
