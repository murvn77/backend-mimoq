import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

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
      const newExperiment = this.experimentoRepo.create(data);
      return this.experimentoRepo.save(newExperiment);
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
}