import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateDeploymentDto, UpdateDeploymentDto } from 'src/proyecto/dtos/despliegue.dto';
import { DespliegueIndividualService } from 'src/proyecto/services/despliegue-individual/despliegue-individual.service';
import { DespliegueMultipleService } from 'src/proyecto/services/despliegue-multiple/despliegue-multiple.service';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';

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


    @Get('proyecto/:id')
    findAllByProject(@Param('id', ParseIntPipe) id: number) {
        return this.despliegueService.findAllByProject(id);
    }

    @Get('image/usuarioImg/:usuario/nombreImg/:nombre/tagImg/:tag')
    findOneByImage(@Param('usuario') usuario: string, @Param('nombre') nombre: string, @Param('tag') tag: string) {
        return this.despliegueService.findOneByImage(usuario, nombre, tag);
    }

    @Post('individual')
    createIndividualDeployment(@Body() payload: CreateDeploymentDto) {
        console.log('Body en controller', payload);
        return this.despliegueIndividualService.validateProjectToDeploy(payload);
    }

    @Post('multiple')
    createMultipleDeployment(@Body() payload: CreateDeploymentDto) {
        console.log('Body en controller', payload);
        return this.despliegueMultipleService.validateProjectToDeploy(payload);
    }

    @Put(':id')
    updateDeployment(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateDeploymentDto,
    ) {
        return this.despliegueService.updateDeployment(id, payload);
    }

    @Delete(':id/labelk8s/:nombreLabelk8s')
    removeDeployment(@Param('id', ParseIntPipe) id: number, @Param('nombreLabelk8s') nombreLabelk8s: string) {
        return this.despliegueService.removeDeployment(id, nombreLabelk8s);
    }
}
