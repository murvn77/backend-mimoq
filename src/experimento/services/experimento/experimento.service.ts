import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';

import simpleGit from 'simple-git';
import { CreateExperimentoDto } from 'src/experimento/dtos/experimento.dto';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { Repository } from 'typeorm';

import { exec } from 'child_process';


// @Injectable()
export class ExperimentoService {
  constructor(
    // @InjectRepository(Experimento)
    private experimentoRepo: Repository<Experimento>,

  ) { }

  async findOneBy(id: number) {
    try {
      const exp = await this.experimentoRepo.findOneBy({
        id_experimento: id
      });
      if (!(exp instanceof Experimento)) {
        throw new NotFoundException(
          `Experimento con id #${id} no se encuentra en la Base de Datos`,
        );
      }
      return exp;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando a un experimento por id: ${error}`,
      );
    }
  }

  async crearExperimento(data: CreateExperimentoDto) {
    try {
      const git = simpleGit();
      const tempDir = './temp-repo';

      await git.clone(data.url_proyecto, tempDir);

      const urlParts = data.url_proyecto.split('/');
      const username = urlParts[urlParts.length - 2];
      const repoName = urlParts[urlParts.length - 1].replace('.git', ''); // Eliminar ".git" del nombre del repositorio


      const absolutePathToFile = path.join(tempDir, 'Dockerfile');

      // Leer el contenido del Dockerfile
      const content = await fs.readFile(absolutePathToFile, 'utf8');

      // Imprimir el contenido del Dockerfile
      console.log('Contenido del Dockerfile:');
      console.log(content);

      this.construirImagen(username, repoName, tempDir)

      // Eliminar el directorio clonado
      // await fs.rm(tempDir, { recursive: true });

    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas creando el usuario: ${error}`,
      );
    }
  }

  async construirImagen(username: string, repoName: string, tempDir: string) {
    const nombreCompletoImagen = `${username}/${repoName}`;
    const buildCommand = `docker build -t ${nombreCompletoImagen}:1.0.0 ${tempDir}`;

    exec(buildCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al construir la imagen Docker: ${error}`);
        return;
      }
      console.log(`Imagen Docker construida correctamente: ${stdout}`);

      // Guardar la imagen construida en el registry local
      const pushCommand = `docker tag ${nombreCompletoImagen}:1.0.0 localhost:5000/${nombreCompletoImagen}:1.0.0`;
      exec(pushCommand, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error al etiquetar la imagen Docker: ${error}`);
          return;
        }
        console.log(`Imagen Docker etiquetada correctamente: ${stdout}`);

        const pushCommand = `docker push localhost:5000/${nombreCompletoImagen}:1.0.0`;
        exec(pushCommand, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error al subir la imagen Docker al registry local: ${error}`);
            return;
          }
          console.log(`Imagen Docker subida correctamente al registry local: ${stdout}`);

          const customValues = {
            nombreAplicacion: 'mi-aplicacion',
            nombreImagen: `localhost:5000/${nombreCompletoImagen}`,
            etiquetaImagen: '1.0.0',
            replicas: 2,
          };


          this.construirArchivoValues(customValues)
        });
      });
    })

  }

  async construirArchivoValues(customValues: any) {
    try {
      // Convertir los valores personalizados a YAML
      const yamlContent = yaml.dump(customValues);

      // Escribir los valores personalizados en un archivo YAML
      fs.writeFileSync('values.yaml', yamlContent, 'utf8');

      // Ejecutar Helm con los valores personalizados
      const helmCommand = `helm install mywebapp-release-2 C:/Users/maure/Desktop/templates-deployment --values values.yaml`;
      

      //** CONTRUIR METODO UPDATE */
      // const helmCommand = `helm upgrade mywebapp-release-2 C:/Users/maure/Desktop/templates-deployment --values values.yaml`;
      exec(helmCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error al ejecutar Helm: ${error}`);
          return;
        }
        console.log(`Despliegue exitoso: ${stdout}`);
      });
    } catch (error) {
      console.error(`Error al crear valores personalizados: ${error}`);
    }
  }

}
