import { Module } from '@nestjs/common';
import { ProyectoService } from './services/proyecto/proyecto.service';
import { ProyectoController } from './controllers/proyecto/proyecto.controller';
import { DespliegueController } from './controllers/despliegue/despliegue.controller';
import { DespliegueService } from './services/despliegue/despliegue.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { Despliegue } from './entities/despliegue.entity';
import { UsuarioModule } from 'src/usuario/usuario.module';
import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Proyecto, Despliegue])],
  providers: [ProyectoService, DespliegueService, UsuarioService],
  controllers: [ProyectoController, DespliegueController],
})
export class ProyectoModule { }
