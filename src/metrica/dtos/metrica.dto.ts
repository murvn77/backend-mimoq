import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateMetricaDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString()
    @ApiProperty()
    readonly nombre: string;
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString()
    @ApiProperty()
    readonly descripcion: string;
    @IsNotEmpty({ message: 'La fórmula es obligatoria' })
    @IsString()
    @ApiProperty()
    readonly formula: string;
    @IsNotEmpty({ message: 'La nombre de prometheus es obligatorio' })
    @IsString()
    @ApiProperty()
    readonly nombre_prometheus: string;
    @IsNotEmpty({message: 'El FK del subatributo es obligatorio'})
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    readonly fk_id_subatributo: number;
}
