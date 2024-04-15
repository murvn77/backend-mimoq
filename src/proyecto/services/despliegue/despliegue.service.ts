/** NestJS */
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Dtos */
import { UpdateDeploymentDto } from 'src/proyecto/dtos/despliegue.dto';

/** Entities */
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';

/** Utils */
import * as fs from 'fs-extra';
import * as net from 'net';
import { exec } from 'child_process';
import simpleGit from 'simple-git';
import { ProyectoService } from '../proyecto/proyecto.service';
import { Proyecto } from 'src/proyecto/entities/proyecto.entity';

@Injectable()
export class DespliegueService {
  constructor(
    @InjectRepository(Despliegue)
    private despliegueRepo: Repository<Despliegue>,
    private proyectoService: ProyectoService,
  ) { }

  async findAll() {
    return await this.despliegueRepo.find({});
  }

  async findAllByProject(id: number) {
    try {
      const proyecto = await this.proyectoService.findOne(id);

      if ( !(proyecto instanceof Proyecto) ) {
        throw new NotFoundException(
          `Proyecto con id #${id} no se encuentra en la Base de Datos para mostrar los despliegues`,
        );
      }

      return await this.despliegueRepo.find({
        where: { proyecto: proyecto }
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando los despliegues de un proyecto: ${error}`,
      );
    }
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
      // where: {
      //   usuario_img: usu_img,
      //   nombre_img: nom_img,
      //   tag_img: tag_img,
      // }
    });
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

  async findAvailablePort(): Promise<number> {
    const minPort = 30000;
    const maxPort = 32767;

    const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
    let portInUse = await this.isPortInUse(port);

    while (portInUse) {
      const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
      portInUse = await this.isPortInUse(port);
    }

    return port;
  }

  /** Construcción de archivo "Values" para Helm */
  async deployApp(nombreApp: string, yamlValues: any): Promise<boolean> {
    try {
        console.log('DATA VALUES YAML: ', yamlValues);

        // Escribir el archivo YAML
        const dirValues = `./utils/values.yaml`;
        fs.writeFileSync(dirValues, yamlValues, 'utf8');

        console.log(`Nombre de la aplicación para despliegue: ${nombreApp}`);

        const helmCommand = `helm install ${nombreApp} ./utils/tmpl-deployment-helm --values ./utils/values.yaml --timeout=45s --wait`;

        return await new Promise<boolean>((resolve, reject) => {
            exec(helmCommand, async (error, stdout) => {
                if (error) {
                    console.error(`Error al ejecutar creación de Helm: ${error.message}`);
                    const helmUpdateCommand = `helm upgrade ${nombreApp} ./utils/tmpl-deployment-helm --values ./utils/values.yaml --timeout=45s --wait`;
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
  async cloneRepository(url: string, tempDir: string) {
    const git = simpleGit();
    await git.clone(url, tempDir);
  }

  /** Ejecutar comandos en la consola */
  async executeCommand(command: string): Promise<{ stdout: string, stderr: string }> {
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

    // **HELM UPDATE* ///

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
