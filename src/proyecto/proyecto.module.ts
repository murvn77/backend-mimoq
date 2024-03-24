import { Module } from '@nestjs/common';
import { ProyectoService } from './services/proyecto/proyecto.service';
import { ProyectoController } from './controllers/proyecto/proyecto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { Despliegue } from './entities/despliegue.entity';
import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { DespliegueIndividualService } from './services/despliegue-individual/despliegue-individual.service';
import { DespliegueMultipleService } from './services/despliegue-multiple/despliegue-multiple.service';
import { DespliegueExperimentoService } from 'src/experimento/services/despliegue-experimento/despliegue-experimento.service';
import { DespliegueExperimento } from '../experimento/entities/despliegue-experimento.entity';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { ExperimentoService } from 'src/experimento/services/experimento/experimento.service';
import { RolUsuario } from 'src/usuario/entities/rol-usuario.entity';
import { RolUsuarioService } from 'src/usuario/services/rol-usuario/rol-usuario.service';
import { DespliegueController } from './controllers/despliegue/despliegue.controller';
import { DespliegueService } from './services/despliegue/despliegue.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proyecto,
      Despliegue,
      Usuario,
      DespliegueExperimento,
      Experimento,
      RolUsuario,
    ])],
  providers: [
    UsuarioService,
    ProyectoService,
    DespliegueService,
    DespliegueIndividualService,
    DespliegueMultipleService,
    DespliegueExperimentoService,
    ExperimentoService,
    RolUsuarioService
  ],
  controllers: [ProyectoController, DespliegueController],
})
export class ProyectoModule { }
