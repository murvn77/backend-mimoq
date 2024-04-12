import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Proyecto } from 'src/proyecto/entities/proyecto.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProjectDto, UpdateProjectDto } from 'src/proyecto/dtos/proyecto.dto';
import { UsuarioService } from 'src/usuario/services/usuario/usuario.service';

import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { DespliegueService } from '../despliegue/despliegue.service';

interface ServiceConfig {
  image: string;
  container_name: string;
  ports: [''];
}
interface DockerComposeConfig {
  services: { [serviceName: string]: ServiceConfig };
}
@Injectable()
export class ProyectoService {
  constructor(
    @InjectRepository(Proyecto)
    private proyectoRepo: Repository<Proyecto>,
    private usuarioService: UsuarioService,
    private despliegueUtilsService: DespliegueService,
  ) { }

  async findAll() {
    try {
      return await this.proyectoRepo.find({
        relations: ['usuario']
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando los proyectos: ${error}`,
      );
    }
  }

  async findOne(id: number) {
    try {
      const project = await this.proyectoRepo.findOne({
        where: { id_proyecto: id },
        relations: ['despliegues']
      });
      if (!(project instanceof Proyecto)) {
        throw new NotFoundException(
          `Proyecto con id #${id} no se encuentra en la Base de Datos`,
        );
      }
      return project;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando proyecto por id: ${error}`,
      );
    }
  }

  async findOneByUrlProject(url_proyecto: string) {
    try {
      const project = await this.proyectoRepo.findOne({
        where: { url_repositorio: url_proyecto },
        relations: ['despliegues']
      });
      return project;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando el proyecto dada la url: ${error}`,
      );
    }
  }

  async createProject(data: CreateProjectDto) {
    try {
      let namesApp: string[] = [''];

      // const projectExists = await this.findOneByUrlProject(data.url_proyecto);
      // if (projectExists instanceof Proyecto) {
      //   throw new InternalServerErrorException(
      //     `Este proyecto ya se encuentra registrado en la BD`,
      //   );
      // }

      const newProject = this.proyectoRepo.create(data);

      if (data.docker_compose == true) {
        const tempDir = `./utils/temp-repo-${Date.now()}`;
        await this.despliegueUtilsService.cloneRepository(data.url_repositorio, tempDir);

        const composeData = this.parseDockerCompose(`${tempDir}/docker-compose.yml`);
        const imagesToBuild = this.dockerImageParameters(composeData);

        namesApp = imagesToBuild.map(container => {
          const index = container.image.indexOf("/");
          let nameApp = container.image.substring(index + 1);
          return nameApp = `${nameApp.toLowerCase().replace(/\s/g, '-')}`;
        })

        newProject.nombres_microservicios = namesApp;
      }

      if (data.fk_usuario) {
        const user = await this.usuarioService.findOne(data.fk_usuario);
        newProject.usuario = user;
      }

      return this.proyectoRepo.save(newProject);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas creando el proyecto: ${error}`,
      );
    }
  }

  private parseDockerCompose(filePath: string): DockerComposeConfig {
    try {
      const composeData: DockerComposeConfig = yaml.load(fs.readFileSync(filePath, 'utf8')) as DockerComposeConfig;
      return composeData;
    } catch (error) {
      console.error(error);
      throw new Error('Error parsing docker-compose file');
    }
  }

  private dockerImageParameters(composeData: DockerComposeConfig): any[] {
    const kubernetesSpecs: any[] = [];
    for (const serviceName in composeData.services) {
      if (composeData.services.hasOwnProperty(serviceName)) {
        const serviceConfig = composeData.services[serviceName];
        const [port1,] = serviceConfig.ports[0].split(':').map(port => parseInt(port, 10));

        if (serviceConfig.image != undefined) {
          const kubernetesSpec = {
            name: serviceName,
            image: serviceConfig.image,
            port_expose: port1,
          };
          kubernetesSpecs.push(kubernetesSpec);
        }
      }
    }
    return kubernetesSpecs;
  }

  async updateProject(id: number, cambios: UpdateProjectDto) {
    try {
      const proyecto = await this.proyectoRepo.findOneBy({ id_proyecto: id });

      if (cambios.fk_usuario) {
        const user = await this.usuarioService.findOne(cambios.fk_usuario);
        proyecto.usuario = user;
      }

      this.proyectoRepo.merge(proyecto, cambios);
      return this.proyectoRepo.save(proyecto);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas actualizando el proyecto: ${error}`,
      );
    }
  }

  removeProject(id: number) {
    return this.proyectoRepo.delete(id);
  }
}
