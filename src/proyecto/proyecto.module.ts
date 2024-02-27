import { Module } from '@nestjs/common';
import { ProyectoService } from './services/proyecto/proyecto.service';
import { ProyectoController } from './controllers/proyecto/proyecto.controller';
import { DespliegueController } from './controllers/despliegue/despliegue.controller';
import { DespliegueService } from './services/despliegue/despliegue.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proyecto } from './entities/proyecto.entity';
import { Despliegue } from './entities/despliegue.entity';
import { UsuarioModule } from 'src/usuario/usuario.module';
import { DockerService } from './services/docker/docker.service';
import { HelmService } from './services/helm/helm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proyecto,
      Despliegue
    ]),
    UsuarioModule,
  ],
  providers: [ProyectoService, DespliegueService, DockerService, HelmService],
  controllers: [ProyectoController, DespliegueController],
})
export class ProyectoModule {}
