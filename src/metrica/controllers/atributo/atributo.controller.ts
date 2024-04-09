import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateAtributoDto } from 'src/metrica/dtos/atributo.dto';
import { AtributoService } from 'src/metrica/services/atributo/atributo.service';

@ApiTags('Atributo')
@Controller('atributo')
export class AtributoController {
    constructor(private atributoService: AtributoService) { }

    @Get()
    find() {
        return this.atributoService.find();
    }

    @Get(':nombre')
    findOneByName(@Param('nombre') nombre: string) {
        return this.atributoService.findOneByName(nombre);
    }

    @Post()
    createAtributo(@Body() payload: CreateAtributoDto) {
        return this.atributoService.createAtributo(payload);
    }
}
