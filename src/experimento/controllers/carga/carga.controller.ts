import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCargaDto, UpdateCargaDto } from 'src/experimento/dtos/carga.dto';
import { CargaService } from 'src/experimento/services/carga/carga.service';

@ApiTags('Carga')
@Controller('carga')
export class CargaController {
    constructor(
        private cargaService: CargaService,
    ) { }

    @Get()
    findAll() {
        return this.cargaService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.cargaService.findOne(id);
    }

    @Post()
    createCarga(@Body() payload: CreateCargaDto) {
        console.log('Body en controller', payload);
        return this.cargaService.createCarga(payload);
    }

    @Put(':id')
    updateCarga(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateCargaDto,
    ) {
        return this.cargaService.updateCarga(id, payload);
    }

    @Delete(':id')
    removeCarga(@Param('id', ParseIntPipe) id: number) {
        return this.cargaService.removeCarga(id);
    }
}
