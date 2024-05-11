import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateExperimentoDto } from 'src/experimento/dtos/experimento.dto';
import { ExperimentoService } from 'src/experimento/services/experimento/experimento.service';
import { UpdateExperimentoDto } from '../../dtos/experimento.dto';

import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Experimento')
@Controller('experimento')
export class ExperimentoController {
  constructor(
    private experimentoService: ExperimentoService,
  ) { }

  @Get('descargar/:nombre_carpeta/:nombre_archivo')
  descargarArchivo(@Param('nombre_carpeta') nombre_carpeta: string, @Param('nombre_archivo') nombre_archivo: string, @Res() res: Response) {
    const archivoPath = path.join(__dirname, '../../../../', `utils/resultados-experimentos/${nombre_carpeta}`, nombre_archivo);
    console.log(archivoPath)
    // Verificar si el archivo existe
    if (fs.existsSync(archivoPath)) {
      // Establecer las cabeceras para la descarga
      res.setHeader('Content-Disposition', `attachment; filename=${nombre_archivo}`);
      res.setHeader('Content-Type', 'text/csv');

      // Leer el archivo y enviarlo como respuesta
      const archivoStream = fs.createReadStream(archivoPath);
      archivoStream.pipe(res);
    } else {
      // Si el archivo no existe, lanzar una excepción de recurso no encontrado
      throw new NotFoundException('Archivo no encontrado');
    }
  }

  @Get()
  findAll() {
    return this.experimentoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.experimentoService.findOne(id);
  }

  @Post()
  createUsuario(@Body() payload: CreateExperimentoDto) {
    console.log('Body en controller', payload);
    return this.experimentoService.createExperiment(payload);
  }

  @Put(':id')
  updateExperiment(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateExperimentoDto,
  ) {
    return this.experimentoService.updateExperiment(id, payload);
  }

  @Delete(':id')
  removeExperiment(@Param('id', ParseIntPipe) id: number) {
    return this.experimentoService.removeExperiment(id);
  }
}
