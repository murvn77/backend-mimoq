import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateAtributoDto } from 'src/metrica/dtos/atributo.dto';
import { AtributoService } from 'src/metrica/services/atributo/atributo.service';
import { SubatributoService } from 'src/metrica/services/subatributo/subatributo.service';

@ApiTags('Subatributo')
@Controller('subatributo')
export class SubatributoController {
    constructor(private subatributoService: SubatributoService) { }

    @Get()
    find() {
        return this.subatributoService.find();
    }

    @Get(':nombre')
    findOneByName(@Param('nombre') nombre: string) {
        return this.subatributoService.findOneByName(nombre);
    }

    @Post()
    createSubatributo(@Body() payload: CreateAtributoDto) {
        return this.subatributoService.createSubatributo(payload);
    }
}

