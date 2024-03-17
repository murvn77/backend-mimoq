/** NestJS */
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Dtos */
import { CreateDeploymentDto, UpdateDeploymentDto } from 'src/proyecto/dtos/despliegue.dto';

/** Entities */
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Proyecto } from 'src/proyecto/entities/proyecto.entity';

/** Services */
import { ProyectoService } from '../proyecto/proyecto.service';

/** Utils */
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import * as net from 'net';
import { exec } from 'child_process';
import simpleGit from 'simple-git';

/** Intefaces para el despliegue con docker-compose */
interface ServiceConfig {
  image: string;
  container_name: string;
  ports: [''];
}
interface DockerComposeConfig {
  services: { [serviceName: string]: ServiceConfig };
}

@Injectable()
export class DespliegueService {
  private nombreDespliegue: string

  constructor(
    @InjectRepository(Despliegue)
    private despliegueRepo: Repository<Despliegue>,
    private proyectoService: ProyectoService,
  ) { }

  async findAll() {
    return await this.despliegueRepo.find({});
  }

  async findOne(id: number) {
    const despliegue = await this.despliegueRepo.findOneBy({ id_despliegue: id });
    if (!despliegue) {
      throw new NotFoundException(`Despliegue con id #${id} no se encuentra en la Base de Datos`);
    }
    return despliegue;
  }

  async findOneByImage(usu_img: string, nom_img: string, tag_img: string) {
    return await this.despliegueRepo.findOne({
      where: {
        usuario_img: usu_img,
        nombre_img: nom_img,
        tag_img: tag_img,
      }
    });
  }

  /** Revisa si los microservicios están en un mismo repo o no */
  async validateProjectToDeploy(data: CreateDeploymentDto) {
    const proyecto = await this.proyectoService.findOne(data.fk_proyecto);

    if (!proyecto) {
      throw new InternalServerErrorException(`No se encontró el proyecto con id ${data.fk_proyecto}`);
    }

    const existingDeployment = await this.despliegueRepo.findOne({
      where: {
        cant_replicas: data.cant_replicas,
        cant_pods: data.cant_pods,
        nombre_namespace: data.nombre_namespace,
        usuario_img: data.usuario_img,
        nombre_img: data.nombre_img,
        tag_img: data.tag_img,
        proyecto: proyecto
      }
    });

    if (existingDeployment) {
      throw new InternalServerErrorException(`Este despliegue ya está registrado en la base de datos`);
    }

    const tempDir = `./utils/temp-repo-${Date.now()}`;
    await this.cloneRepository(proyecto.url_proyecto, tempDir);

    if (proyecto.docker_compose) {
      if (proyecto.dockerfile) {
        this.recorrerCadaCarpetaDelRepoParaDockerfile(); // Mismo repositorio, cada ms con dockerfile
      } else {
        return await this.pullAndPushImageFromDockerCompose(proyecto, data, tempDir); // Mismo repositorio, dockercompose con imagenes en registry
      }
    } else {
      return await this.createIndividualDeployment(proyecto, data, tempDir); // Diferente repositorio
    }
  }

  async recorrerCadaCarpetaDelRepoParaDockerfile() {
    /** Impelemtación después */
  }

  /** Crear imagen en el registro local si el repositorio tiene dockerfile */
  private async buildAndPushImage(proyecto: Proyecto, data: CreateDeploymentDto, tempDir: string): Promise<boolean> {
    try {
      const localRegistry = 'localhost:5000';
      const nombreCompletoImagen = `${data.usuario_img}/${data.nombre_img}:${data.tag_img}`;

      const buildCommand = `docker build -t ${nombreCompletoImagen} ${tempDir}`;
      await this.executeCommand(buildCommand);
      console.log(`Imagen Docker construida correctamente`);

      const tagCommand = `docker tag ${nombreCompletoImagen} ${localRegistry}/${nombreCompletoImagen}`;
      await this.executeCommand(tagCommand);
      console.log(`Imagen Docker etiquetada correctamente`);

      const removeBuildCommand = `docker image rm ${nombreCompletoImagen}`;
      await this.executeCommand(removeBuildCommand);
      console.log(`Imagen Docker original eliminada correctamente`);

      const pushCommand = `docker push ${localRegistry}/${nombreCompletoImagen}`;
      await this.executeCommand(pushCommand);
      console.log(`Imagen Docker subida correctamente al registry local`);


      /** Costrucción de values para helm */
      const customValues = {
        appName: `${proyecto.titulo.toLowerCase().replace(/\s/g, '-')}`,
        cantReplicas: `${data.cant_replicas}`,
        name: `${localRegistry}/${nombreCompletoImagen}`,
        tag: `${data.tag_img}`,
      };

      this.nombreDespliegue = customValues.appName;

      return await this.construirArchivoValues(proyecto.titulo, customValues);
    } catch (error) {
      console.error(`Error en buildAndPushImage: ${error.message}`);
      return false;
    }
  }

  async createIndividualDeployment(proyecto: Proyecto, data: CreateDeploymentDto, tempDir: string) {
    const despliegueExitoso = await this.buildAndPushImage(proyecto, data, tempDir);

    if (!despliegueExitoso) {
      throw new InternalServerErrorException(`No se pudo realizar el despliegue`);
    }

    await fs.remove(tempDir);

    const newDeployment = this.despliegueRepo.create(data);
    newDeployment.proyecto = proyecto;
    newDeployment.label_despliegue_k8s = this.nombreDespliegue;

    try {
      await this.despliegueRepo.save(newDeployment);
      return newDeployment;
    } catch (error) {
      throw new InternalServerErrorException(`Error al guardar el despliegue en la base de datos: ${error.message}`);
    }
  }

  /** Crear imágenes en el registro local si el repositorio tiene docker-compose */
  private async pullAndPushImageFromDockerCompose(proyecto: Proyecto, data: CreateDeploymentDto, tempDir: string) {
    try {
      const composeData = this.parseDockerCompose(`${tempDir}/docker-compose.yml`);
      const imagesToBuild = this.dockerImageParameters(composeData);

      return await this.pullImage(proyecto, imagesToBuild, data)
    } catch (error) {
      console.error(`Error en buildAndPushMultipleImage: ${error.message}`);
      return false;
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
        const [port1, ] = serviceConfig.ports[0].split(':').map(port => parseInt(port, 10));

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

  private async pullImage(proyecto: Proyecto, imagesToBuild: any[], data: CreateDeploymentDto) {
    const localRegistry = 'localhost:5000';
    let desplieguesRealizados: Despliegue[] = [];

    for (const container of imagesToBuild) {

      const imageName = container.image;
      console.log(`Desplegando el contenedor con nombre: ${container.name}`)

      const pullCommand = `docker pull ${imageName}`;
      await this.executeCommand(pullCommand);
      console.log(`Haciendo pull de la imagen`);

      const tagCommand = `docker tag ${imageName} ${localRegistry}/${imageName}`;
      await this.executeCommand(tagCommand);
      console.log(`Imagen Docker etiquetada correctamente`);

      const removeBuildCommand = `docker image rm ${imageName}`;
      await this.executeCommand(removeBuildCommand);
      console.log(`Imagen Docker original eliminada correctamente`);

      const pushCommand = `docker push ${localRegistry}/${imageName}`;
      await this.executeCommand(pushCommand);
      console.log(`Imagen Docker subida correctamente al registry local`);

      const index = imageName.indexOf("/");
      const nameApp = imageName.substring(index + 1);

      const customValues = {
        appName: `${nameApp}`,
        namespace: `${data.nombre_namespace}`,
        cantReplicas: `${data.cant_replicas}`,
        name: `${localRegistry}/${imageName}`,
        tag: `${data.tag_img}`,
        portExpose: `${container.port_expose}`,
        nodePort: `${await this.findAvailablePort()}`
      };

      this.nombreDespliegue = customValues.appName;

      const despliegueExitoso = await this.construirArchivoValues(nameApp, customValues);

      if (!despliegueExitoso) {
        throw new InternalServerErrorException(`No se pudo realizar el despliegue`);
      }

      const newDeployment = this.despliegueRepo.create(data);
      newDeployment.proyecto = proyecto;
      newDeployment.label_despliegue_k8s = this.nombreDespliegue;

      desplieguesRealizados.push(newDeployment);
    }

    for (const newDeployment of desplieguesRealizados) {
      try {
        await this.despliegueRepo.save(newDeployment);
      } catch (error) {
        throw new InternalServerErrorException(`Error al guardar el despliegue en la base de datos: ${error.message}`);
      }
    }
    console.log('Llega aquí')
    return desplieguesRealizados;
  }

  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const server = net.createServer()
        .once('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            resolve(true);
          } else {
            reject(err);
          }
        })
        .once('listening', () => {
          server.close();
          resolve(false);
        })
        .listen(port);
    });
  }

  private async findAvailablePort(): Promise<number> {
    const minPort = 30000;
    const maxPort = 32767;

    let port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
    let portInUse = await this.isPortInUse(port);

    while (portInUse) {
      port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
      portInUse = await this.isPortInUse(port);
    }

    return port;
  }

  /** Construcción de archivo "Values" para Helm */
  private async construirArchivoValues(nombre_app: string, customValues: any): Promise<boolean> {
    try {
      const dirValues = `./utils/values.yaml`;
      const yamlContent = yaml.dump(customValues);
      fs.writeFileSync(dirValues, yamlContent, 'utf8');

      const nombreApp = `${nombre_app.toLowerCase().replace(/\s/g, '-')}`;
      console.log('Nombre de la aplicación para despliegue:', nombreApp);

      const helmCommand = `helm install ${nombreApp} ./utils/tmpl-deployment-helm --values ./utils/values.yaml`;

      return await new Promise<boolean>((resolve, reject) => {
        exec(helmCommand, async (error, stdout) => {
          if (error) {
            const helmUpdateCommand = `helm upgrade ${nombreApp} ./utils/tmpl-deployment-helm --values ./utils/values.yaml`;
            exec(helmUpdateCommand, (updateError, updateStdout) => {
              if (updateError) {
                console.error(`Error al ejecutar actualización de Helm: ${updateError.message}`);
                resolve(false);
              } else {
                console.log(`Despliegue exitoso: ${updateStdout}`);
                resolve(true);
              }
            });
          } else {
            console.log(`Despliegue exitoso: ${stdout}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error(`Error en construirArchivoValues: ${error.message}`);
      return false;
    }
  }

  /** Clonar el repositorio */
  private async cloneRepository(url: string, tempDir: string) {
    const git = simpleGit();
    await git.clone(url, tempDir);
  }

  /** Ejecutar comandos en la consola */
  private async executeCommand(command: string): Promise<{ stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }


  async updateDeployment(id: number, cambios: UpdateDeploymentDto) {
    const despliegue = await this.despliegueRepo.findOneBy({ id_despliegue: id });
    if (!despliegue) {
      throw new NotFoundException(`Despliegue con id #${id} no se encuentra en la Base de Datos`);
    }
    this.despliegueRepo.merge(despliegue, cambios);
    return await this.despliegueRepo.save(despliegue);
  }

  async removeDeployment(id: number, nombreApp: string) {
    const deleteCommand = `kubectl delete deploy,svc -l app=${nombreApp}`;
    const { stdout, stderr } = await this.executeCommand(deleteCommand);

    if (stderr) {
      console.error(`Error al eliminar el despliegue y el servicio: ${stderr}`);
    }
    console.log(`Despliegue y servicio eliminados correctamente: ${stdout}`);

    return await this.despliegueRepo.delete(id);
  }
}
