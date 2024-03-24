import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DespliegueExperimentoService } from '../../services/despliegue-experimento/despliegue-experimento.service';
import { CreateDespliegueExperimentoDto } from 'src/experimento/dtos/despliegue-experimento.dto';

@ApiTags('Despliegue experimento')
@Controller('despliegue-experimento')
export class DespliegueExperimentoController {
    constructor(
        private despliegueExperimentoService: DespliegueExperimentoService,
    ) { }

    @Get()
    findAll() {
        return this.despliegueExperimentoService.findAll();
    }

    // @Get(':id')
    // findOne(@Param('id', ParseIntPipe) id: number) {
    //     return this.despliegueExperimentoService.findOne(id);
    // }

    @Post()
    createUsuario(@Body() payload: CreateDespliegueExperimentoDto) {
        console.log('Body en controller', payload);
        return this.despliegueExperimentoService.createDeploymentExperiment(payload);
    }

    // @Put(':id')
    // updateExperiment(
    //     @Param('id', ParseIntPipe) id: number,
    //     @Body() payload: UpdateExperimentoDto,
    // ) {
    //     return this.despliegueExperimentoService.updateExperiment(id, payload);
    // }

    // @Delete(':id')
    // removeExperiment(@Param('id', ParseIntPipe) id: number) {
    //     return this.despliegueExperimentoService.removeExperiment(id);
    // }
}
