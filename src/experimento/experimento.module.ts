import { Module } from '@nestjs/common';
import { ExperimentoService } from './services/experimento/experimento.service';
import { ExperimentoController } from './controllers/experimento/experimento.controller';
import { Experimento } from './entities/experimento.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperimentoDespliegueService } from './services/experimento-despliegue/experimento-despliegue.service';
import { DespliegueExperimentoController } from './controllers/despliegue-experimento/despliegue-metrica.controller';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Proyecto } from 'src/proyecto/entities/proyecto.entity';
import { ProyectoService } from 'src/proyecto/services/proyecto/proyecto.service';
import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { RolUsuario } from 'src/usuario/entities/rol-usuario.entity';
import { RolUsuarioService } from 'src/usuario/services/rol-usuario/rol-usuario.service';
import { ExperimentoDespliegue } from './entities/experimento-despliegue.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Experimento,
      ExperimentoDespliegue,
      Despliegue,
      Proyecto,
      Usuario,
      RolUsuario
    ]),
  ],
  providers: [ExperimentoService, ExperimentoDespliegueService, DespliegueService, ProyectoService, UsuarioService, RolUsuarioService],
  controllers: [ExperimentoController, DespliegueExperimentoController],
})
export class ExperimentoModule {}
