import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateDeploymentDto, UpdateDeploymentDto } from 'src/proyecto/dtos/despliegue.dto';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';

@ApiTags('Despliegue')
@Controller('despliegue')
export class DespliegueController {
  constructor(
    private despliegueService: DespliegueService,
  ) { }

  @Get()
  findAll() {
    return this.despliegueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.despliegueService.findOne(id);
  }

  @Get('image/usuarioImg/:usuario/nombreImg/:nombre/tagImg/:tag')
  findOneByImage(@Param('usuario') usuario: string, @Param('nombre') nombre: string, @Param('tag') tag: string) {
    return this.despliegueService.findOneByImage(usuario, nombre, tag);
  }

  @Post()
  createDeployment(@Body() payload: CreateDeploymentDto) {
    console.log('Body en controller', payload);
    return this.despliegueService.createDeployment(payload);
  }

  @Put(':id')
  updateDeployment(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateDeploymentDto,
  ) {
    return this.despliegueService.updateDeployment(id, payload);
  }

  @Delete(':id/nombreApp/:nombreApp')
  removeDeployment(@Param('id', ParseIntPipe) id: number, @Param('nombreApp') nombreApp: string) {
    return this.despliegueService.removeDeployment(id, nombreApp);
  }
}
