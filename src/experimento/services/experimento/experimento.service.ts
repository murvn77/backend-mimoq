import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec } from 'child_process';

import { CreateExperimentoDto, UpdateExperimentoDto } from 'src/experimento/dtos/experimento.dto';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ExperimentoService {
  constructor(
    @InjectRepository(Experimento)
    private experimentoRepo: Repository<Experimento>,
  ) { }


  async findAll() {
    try {
      return await this.experimentoRepo.find({
        // relations: ['rol', 'perfil', 'estadoUsuario'],
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando los experimentos: ${error}`,
      );
    }
  }

  async findOne(id: number) {
    try {
      const experiment = await this.experimentoRepo.findOneBy({ id_experimento: id });
      if (!(experiment instanceof Experimento)) {
        throw new NotFoundException(
          `Experimento con id #${id} no se encuentra en la Base de Datos`,
        );
      }
      return experiment;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando a un experimento por id: ${error}`,
      );
    }
  }

  async createExperiment(data: CreateExperimentoDto) {
    try {
      const dirLoad = './utils/generate-load-k6';
      const nameImage = 'mimo1/load-k6:1.0.0';
      const localRegistry = 'localhost:5000';

      const buildCommand = `docker build -t ${nameImage} ${dirLoad}`;
      await this.executeCommand(buildCommand);
      console.log(`Imagen Docker construida correctamente`);

      const tagCommand = `docker tag ${nameImage} ${localRegistry}/${nameImage}`;
      await this.executeCommand(tagCommand);
      console.log(`Imagen Docker etiquetada correctamente`);
      
      const pushCommand = `docker push ${localRegistry}/${nameImage}`;
      await this.executeCommand(pushCommand);
      console.log(`Imagen Docker subida correctamente al registry local`);

      // const customValuesLoad = {
      //   appName: `${proyecto.titulo.toLowerCase().replace(/\s/g, '-')}`,
      //   cantReplicas: `${data.cant_replicas}`,
      //   name: `${localRegistry}/${nombreCompletoImagen}`,
      //   tag: `${data.tag_img}`,
      // };

      console.log(`Genenerando carga en el microservicio`);

      const loadCommand = `docker run -e API_URL=http://test.k6.io/ -e VUS=50 -e DURATION=1m -e ENDPOINTS="/contacts.php,/news.php,/browser.php" -e DELIMITER="," ${nameImage}`
      const content = await this.executeCommand(loadCommand);

      console.log('Contenido del comando: ', content)


      // const newExperiment = this.experimentoRepo.create(data);

      // return this.experimentoRepo.save(newExperiment);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas creando el experimento: ${error}`,
      );
    }
  }

  async updateExperiment(id: number, cambios: UpdateExperimentoDto) {
    try {
      const experiment = await this.experimentoRepo.findOneBy({ id_experimento: id });
      // if (cambios.fk_estadoU) {
      //     const estado = await this.estadoUsuarioService.findOne(
      //         cambios.fk_estadoU,
      //     );
      //     user.estadoUsuario = estado;
      // }

      this.experimentoRepo.merge(experiment, cambios);
      return this.experimentoRepo.save(experiment);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas actualizando el experimento: ${error}`,
      );
    }
  }

  removeExperiment(id: number) {
    return this.experimentoRepo.delete(id);
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