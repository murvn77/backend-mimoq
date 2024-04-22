import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec } from 'child_process';
import { Repository } from 'typeorm';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';

import * as fs from 'fs';
import { CreateExperimentoDto, UpdateExperimentoDto } from 'src/experimento/dtos/experimento.dto';
import { MetricaService } from 'src/metrica/services/metrica/metrica.service';
import { CargaService } from '../carga/carga.service';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { Metrica } from 'src/metrica/entities/metrica.entity';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Carga } from 'src/experimento/entities/carga.entity';

@Injectable()
export class ExperimentoService {
  constructor(
    @InjectRepository(Experimento)
    private experimentoRepo: Repository<Experimento>,
    private despliegueUtilsService: DespliegueService,
    private metricaService: MetricaService,
    private cargaService: CargaService,
  ) { }


  async findAll() {
    try {
      return await this.experimentoRepo.find({
        relations: ['carga', 'despliegues', 'metricas']
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
      const deployExperiment = await this.experimentoRepo.findOne({
        where: { id_experimento: id },
        relations: ['carga', 'despliegues', 'metricas']
      });
      if (!(deployExperiment instanceof Experimento)) {
        throw new NotFoundException(
          `Experimento con id #${id} no se encuentra en la Base de Datos`,
        );
      }
      return deployExperiment;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas encontrando a un experimento por id: ${error}`,
      );
    }
  }

  async createExperiment(data: CreateExperimentoDto) {
    try {
      const metrics: Metrica[] = [];
      const deployments: Despliegue[] = [];
      let files: string[] = [];

      for (const fk_id_metrica of data.fk_ids_metricas) {
        const metric = await this.metricaService.findOne(fk_id_metrica);
        if (!metric) throw new NotFoundException(`Metrica con id #${fk_id_metrica} no se encuentra en la Base de Datos`);
        metrics.push(metric);
      }

      const load = await this.cargaService.findOne(data.fk_id_carga);

      for (const fk_id_despliegue of data.fk_ids_despliegues) {
        const deployment = await this.despliegueUtilsService.findOne(fk_id_despliegue);
        if (!deployment) throw new NotFoundException(`Despliegue con id #${fk_id_despliegue} no se encuentra en la Base de Datos`);
        deployments.push(deployment);
      }

      const buildCommand = `kubectl get pod | grep "Running" | wc -l`;
      const buildCOmmando2 = `kubectl get pods -o=json | jq -r '.items[] | select(any(.status.containerStatuses[]; .state.running)) | .metadata.labels.app'`;
      const { stdout, stderr } = await this.despliegueUtilsService.executeCommand(buildCommand);
      const numberOfRunningPods = parseInt(stdout.trim()); // Convertir la salida a un número entero
      console.log(`Número de pods en estado "Running": ${numberOfRunningPods}`);


      for (let i = 0; i < deployments.length; i++) {
        const ipCluster = '192.168.49.2'
        const url = `http://${ipCluster}:${deployments[i].puerto}`

        const dirLoad = './utils/generate-load-k6/load_test.js';
        console.log(`Genenerando carga en el microservicio que está en: ${url}`);

        files = [];

        console.log("LOAD DURATION: " + load.duracion_picos[i]);
        console.log("LOAD DURATION: " + load.cant_usuarios[i]);


        for (let j = 0; j < data.cant_replicas; j++) {
          const out = `./utils/test-results-${i}-${j}.csv`;
          const loadCommand = `k6 run --out csv=${out} -e API_URL=${url} -e VUS="${load.cant_usuarios[j]}" -e DURATION="${load.duracion_picos[j]}" -e ENDPOINTS="${data.endpoints[j]}" -e DELIMITER="," ${dirLoad}`
          await this.executeCommand(loadCommand);

          const contenidoCSV = fs.readFileSync(out, 'utf8');

          files.push(contenidoCSV);

          // console.log('FIles...', files[i]);
          console.log(`Generó carga. Réplica ${i+1} del experimento terminada.`);
        }
      }

      const newExperiment = this.experimentoRepo.create(data);

      newExperiment.despliegues = deployments;
      newExperiment.metricas = metrics;;
      newExperiment.carga = load;
      // newExperiment.resultado = files;

      return this.experimentoRepo.save(newExperiment);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas creando el experimento: ${error}`,
      );
    }
  }

  sumTimes(totalTime: string, timesString: string): boolean {
    const totalTimeUnit = totalTime.charAt(totalTime.length - 1); // Obtener la unidad del totalTime
    const totalSeconds = this.convertToSeconds(totalTime.substring(0, totalTime.length - 1), totalTimeUnit); // Convertir totalTime a segundos

    const timesArray = timesString.split(',').map(time => time.trim()); // Dividir la cadena de tiempos en segmentos y eliminar espacios

    let sumSeconds = 0;
    let sumMinutes = 0;

    // Iterar sobre cada elemento en la cadena de tiempos
    timesArray.forEach(timeString => {
      const unit = timeString.charAt(timeString.length - 1); // Obtener la unidad (s o m)
      const value = parseInt(timeString.substring(0, timeString.length - 1)); // Obtener el valor numérico

      if (unit === 's') {
        sumSeconds += value;
      } else if (unit === 'm') {
        sumMinutes += value;
      }
    });

    // Convertir minutos a segundos
    sumSeconds += sumMinutes * 60;

    // Verificar si la suma de los tiempos del array es igual al totalTime
    return totalSeconds === sumSeconds;
  }

  private convertToSeconds(value: string, unit: string): number {
    if (unit === 's') {
      return parseInt(value);
    } else if (unit === 'm') {
      return parseInt(value) * 60;
    } else {
      throw new Error('Unidad de tiempo no válida');
    }
  }

  async updateExperiment(id: number, cambios: UpdateExperimentoDto) {
    try {
      const deployExperiment = await this.experimentoRepo.findOneBy({ id_experimento: id });
      // if (cambios.fk_estadoU) {
      //     const estado = await this.estadoUsuarioService.findOne(
      //         cambios.fk_estadoU,
      //     );
      //     user.estadoUsuario = estado;
      // }

      this.experimentoRepo.merge(deployExperiment, cambios);
      return this.experimentoRepo.save(deployExperiment);
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
