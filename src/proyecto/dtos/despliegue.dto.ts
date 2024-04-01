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
    @IsString()
    @ApiProperty()
    readonly nombre: string;
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
    readonly namespace: string;
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_proyecto: number;
}

export class UpdateDeploymentDto extends PartialType(CreateDeploymentDto) {}
