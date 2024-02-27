import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUsuarioDto, UpdateUsuarioDto } from 'src/usuario/dtos/usuario.dto';
import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';

@ApiTags('Usuario')
@Controller('usuario')
export class UsuarioController {
    constructor(
        private usuarioService: UsuarioService,
    ) { }

    @Get()
    findAll() {
        return this.usuarioService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usuarioService.findOne(id);
    }

    @Get('correo/:correo_usuario')
    findOneByEmail(@Param('correo_usuario') correo_usuario: string) {
        return this.usuarioService.findOneByEmail(correo_usuario);
    }

    //   @Get(':id/proyectos')
    //   findProjectsByUser(@Param('id', ParseIntPipe) id: number) {
    //     return this.usuarioService.findUserProjects(id);
    //   }


    // @Roles(Role.LIDER, Role.COORDINADOR)
    @Post()
    createUsuario(@Body() payload: CreateUsuarioDto) {
        console.log('Body en controller', payload);
        return this.usuarioService.createUser(payload);
    }

    @Put(':id/:pssActual/:passNew')
    updatePass(
        @Param('id', ParseIntPipe) id: number,
        @Param('pssActual') pssActual: string,
        @Param('passNew') passNew: string,
    ) {
        return this.usuarioService.updatePassword(id, pssActual, passNew);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() payload: UpdateUsuarioDto,
    ) {
        return this.usuarioService.update(id, payload);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usuarioService.remove(id);
    }
}
