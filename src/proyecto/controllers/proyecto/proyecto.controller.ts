import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateProjectDto, UpdateProjectDto } from 'src/proyecto/dtos/proyecto.dto';
import { ProyectoService } from 'src/proyecto/services/proyecto/proyecto.service';

@ApiTags('Proyecto')
@Controller('proyecto')
export class ProyectoController {
  constructor(
    private proyectoService: ProyectoService,
  ) { }

  @Get()
  findAll() {
    return this.proyectoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proyectoService.findOne(id);
  }

  @Get('url_proyecto/:url_proyecto')
  findOneByUrlProject(@Param('url_proyecto') url_proyecto: string) {
    return this.proyectoService.findOneByUrlProject(url_proyecto);
  }

  @Post()
  createProject(@Body() payload: CreateProjectDto) {
    console.log('Body en controller', payload);
    return this.proyectoService.createProject(payload);
  }

  @Put(':id')
  updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateProjectDto,
  ) {
    return this.proyectoService.updateProject(id, payload);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proyectoService.removeProject(id);
  }
}
