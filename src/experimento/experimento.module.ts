import { Module } from '@nestjs/common';
import { ExperimentoService } from './services/experimento/experimento.service';
import { ExperimentoController } from './controllers/experimento/experimento.controller';
import { Experimento } from './entities/experimento.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DespliegueExperimentoService } from './services/despliegue-experimento/despliegue-experimento.service';
import { DespliegueExperimentoController } from './controllers/despliegue-experimento/despliegue-metrica.controller';
import { DespliegueExperimento } from './entities/despliegue-experimento.entity';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Proyecto } from 'src/proyecto/entities/proyecto.entity';
import { ProyectoService } from 'src/proyecto/services/proyecto/proyecto.service';
import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { RolUsuario } from 'src/usuario/entities/rol-usuario.entity';
import { RolUsuarioService } from 'src/usuario/services/rol-usuario/rol-usuario.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Experimento,
      DespliegueExperimento,
      Despliegue,
      Proyecto,
      Usuario,
      RolUsuario
    ]),
  ],
  providers: [ExperimentoService, DespliegueExperimentoService, DespliegueService, ProyectoService, UsuarioService, RolUsuarioService],
  controllers: [ExperimentoController, DespliegueExperimentoController],
})
export class ExperimentoModule {}
