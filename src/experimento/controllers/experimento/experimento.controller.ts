import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateExperimentoDto } from 'src/experimento/dtos/experimento.dto';
import { ExperimentoService } from 'src/experimento/services/experimento/experimento.service';
import { UpdateExperimentoDto } from '../../dtos/experimento.dto';

@ApiTags('Experimento')
@Controller('experimento')
export class ExperimentoController {
    constructor(
        private experimentoService: ExperimentoService,
    ) { }

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
