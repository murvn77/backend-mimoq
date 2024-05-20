import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DespliegueService } from '../../services/despliegue/despliegue.service';
import { DespliegueIndividualService } from '../../services/despliegue-individual/despliegue-individual.service';
import { DespliegueMultipleService } from '../../services/despliegue-multiple/despliegue-multiple.service';
import { CreateDeploymentDto, UpdateDeploymentDto } from '../../dtos/despliegue.dto';

@ApiTags('Despliegue')
@Controller('despliegue')
export class DespliegueController {
    constructor(
        private despliegueService: DespliegueService,
        private despliegueIndividualService: DespliegueIndividualService,
        private despliegueMultipleService: DespliegueMultipleService,
    ) { }

    @Get()
    findAll() {
        return this.despliegueService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.despliegueService.findOne(id);
    }

    @Get('nombreHelm/:nombre')
    findOneByHelmName(@Param('nombre') nombre: string) {
        return this.despliegueService.findOneByHelmName(nombre);
    }

    @Post('individual')
    createIndividualDeployment(@Body() payload: CreateDeploymentDto) {
        console.log('Body en controller', payload);
        const rtaFromContollwe = this.despliegueIndividualService.validateProjectToDeploy(payload);
        console.log('from controller: ', rtaFromContollwe);
        return rtaFromContollwe;
    }

    @Post('multiple')
    createMultipleDeployment(@Body() payload: CreateDeploymentDto) {
        console.log('Body en controller', payload);
        const rtaFromContollwe = this.despliegueMultipleService.validateProjectToDeploy(payload);
        console.log('from controller: ', rtaFromContollwe);
        return rtaFromContollwe;
    }

    @Put(':id')
    updateDeployment(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateDeploymentDto,
    ) {
        return this.despliegueMultipleService.updateDeployment(id, payload);
    }

    @Delete(':id/nombreHelm/:nombre')
    removeDeployment(@Param('id', ParseIntPipe) id: number, @Param('nombre') nombre: string) {
        return this.despliegueService.removeDeployment(id, nombre);
    }
}
