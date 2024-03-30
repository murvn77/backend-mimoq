import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateExperimentoDespliegueDto } from 'src/experimento/dtos/experimento-despliegue.dto';
import { ExperimentoDespliegueService } from 'src/experimento/services/experimento-despliegue/experimento-despliegue.service';

@ApiTags('Despliegue experimento')
@Controller('despliegue-experimento')
export class DespliegueExperimentoController {
    constructor(
        private experimentoDespliegueService: ExperimentoDespliegueService,
    ) { }

    @Get()
    findAll() {
        return this.experimentoDespliegueService.findAll();
    }

    // @Get(':id')
    // findOne(@Param('id', ParseIntPipe) id: number) {
    //     return this.despliegueExperimentoService.findOne(id);
    // }

    @Post()
    createDeploymentExperiment(@Body() payload: CreateExperimentoDespliegueDto) {
        console.log('Body en controller', payload);
        return this.experimentoDespliegueService.createDeploymentExperiment(payload);
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
