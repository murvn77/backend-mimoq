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
import { exec } from 'child_process';
import simpleGit from 'simple-git';

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

  async createDeployment(data: CreateDeploymentDto) {
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

  private async cloneRepository(url: string, tempDir: string) {
    const git = simpleGit();
    await git.clone(url, tempDir);
  }

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

      const pushCommand = `docker push ${localRegistry}/${nombreCompletoImagen}`;
      await this.executeCommand(pushCommand);
      console.log(`Imagen Docker subida correctamente al registry local`);

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
}
