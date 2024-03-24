import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRolUsuarioDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly nombre: string;
}