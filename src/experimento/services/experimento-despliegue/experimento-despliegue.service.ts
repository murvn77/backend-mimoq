import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec } from 'child_process';
import { Repository } from 'typeorm';
import { ExperimentoService } from '../experimento/experimento.service';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';
import { ExperimentoDespliegue } from 'src/experimento/entities/experimento-despliegue.entity';
import { CreateExperimentoDespliegueDto } from 'src/experimento/dtos/experimento-despliegue.dto';

import * as fs from 'fs';


@Injectable()
export class ExperimentoDespliegueService {
    constructor(
        @InjectRepository(ExperimentoDespliegue)
        private experimentoDespliegueRepo: Repository<ExperimentoDespliegue>,
        private despliegueUtilsService: DespliegueService,
        private experimentoService: ExperimentoService
    ) { }


    async findAll() {
        try {
            return await this.experimentoDespliegueRepo.find({
                // relations: ['rol', 'perfil', 'estadoUsuario'],
            });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas encontrando los experimentos: ${error}`,
            );
        }
    }

    // async findOne(id: number) {
    //     try {
    //         const deployExperiment = await this.experimentoDespliegueRepo.findOneBy({ id_experimento: id });
    //         if (!(deployExperiment instanceof Experimento)) {
    //             throw new NotFoundException(
    //                 `Experimento con id #${id} no se encuentra en la Base de Datos`,
    //             );
    //         }
    //         return deployExperiment;
    //     } catch (error) {
    //         console.error(error);
    //         throw new InternalServerErrorException(
    //             `Problemas encontrando a un experimento por id: ${error}`,
    //         );
    //     }
    // }

    async createDeploymentExperiment(data: CreateExperimentoDespliegueDto) {
        try {
            const deployment = await this.despliegueUtilsService.findOne(data.fk_id_despliegue);
            const experiment = await this.experimentoService.findOne(data.fk_id_experimento);
            
            if (!deployment) throw new NotFoundException(`Despliegue con id #${data.fk_id_despliegue} no se encuentra en la Base de Datos`);
            if (!experiment) throw new NotFoundException(`Experimento con id #${data.fk_id_experimento} no se encuentra en la Base de Datos`);

            const ipCluster = '192.168.49.2'
            const url = `http://${ipCluster}:${deployment.puerto}`

            const dirLoad = './utils/generate-load-k6/load_test.js';
            console.log(`Genenerando carga en el microservicio que está en: ${url}`);

            let files: string[] = [];

            for (let i = 1; i <= data.cantidad_replicas; i++) {
                const out = `./utils/test-results-${i}.csv`;
                const loadCommand = `k6 run --out csv=${out} -e API_URL=${url} -e VUS=${experiment.cantidad_usuarios} -e DURATION=${experiment.duracion}s -e ENDPOINTS="/" -e DELIMITER="," ${dirLoad}`
                await this.executeCommand(loadCommand);

                const contenidoCSV = fs.readFileSync(out, 'utf8');

                files.push(contenidoCSV);

                console.log('FIles...', files[i]);
                console.log("Dizque generó carga...");
            }

            const newExperimentDeploy = this.experimentoDespliegueRepo.create(data);

            newExperimentDeploy.experimento = experiment;
            newExperimentDeploy.despliegue = deployment;
            // newExperimentDeploy.resultado = files;

            return this.experimentoDespliegueRepo.save(newExperimentDeploy);
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas creando el experimento: ${error}`,
            );
        }
    }

    // async updateExperiment(id: number, cambios: UpdateDespliegueExperimentoDto) {
    //     try {
    //         const deployExperiment = await this.experimentoDespliegueRepo.findOneBy({ id_despliegue_experimento: id });
    //         // if (cambios.fk_estadoU) {
    //         //     const estado = await this.estadoUsuarioService.findOne(
    //         //         cambios.fk_estadoU,
    //         //     );
    //         //     user.estadoUsuario = estado;
    //         // }

    //         this.experimentoDespliegueRepo.merge(deployExperiment, cambios);
    //         return this.experimentoDespliegueRepo.save(deployExperiment);
    //     } catch (error) {
    //         console.error(error);
    //         throw new InternalServerErrorException(
    //             `Problemas actualizando el experimento: ${error}`,
    //         );
    //     }
    // }

    removeExperiment(id: number) {
        return this.experimentoDespliegueRepo.delete(id);
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
