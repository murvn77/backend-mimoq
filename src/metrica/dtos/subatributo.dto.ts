import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubatributoDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @ApiProperty()
  readonly nombre: string;
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString()
  @ApiProperty()
  readonly descripcion: string;
}