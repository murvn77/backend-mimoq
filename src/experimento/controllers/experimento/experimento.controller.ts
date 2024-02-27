import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateExperimentoDto } from 'src/experimento/dtos/experimento.dto';
import { ExperimentoService } from 'src/experimento/services/experimento/experimento.service';

@ApiTags('Experimento')
@Controller('experimento')
export class ExperimentoController {
    constructor(
        private experimentoService: ExperimentoService,
    ) { }

    @Get(':id')
    findOneBy(@Param('id', ParseIntPipe) id: number) {
        return this.experimentoService.findOneBy(id);
    }

    @Post()
    crearExperimento(@Body() payload: CreateExperimentoDto) {
        console.log('Body en controller', payload);
        return this.experimentoService.crearExperimento(payload);
    }
}
