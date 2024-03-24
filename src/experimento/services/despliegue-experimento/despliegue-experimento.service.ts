import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec } from 'child_process';
import { CreateDespliegueExperimentoDto } from 'src/experimento/dtos/despliegue-experimento.dto';
import { DespliegueExperimento } from 'src/experimento/entities/despliegue-experimento.entity';
import { Repository } from 'typeorm';
import { ExperimentoService } from '../experimento/experimento.service';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';

@Injectable()
export class DespliegueExperimentoService {

    constructor(
        @InjectRepository(DespliegueExperimento)
        private despliegueExperimentoRepo: Repository<DespliegueExperimento>,
        private despliegueUtilsService: DespliegueService,
        private experimentoService: ExperimentoService
    ) { }


    async findAll() {
        try {
            return await this.despliegueExperimentoRepo.find({
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
    //         const deployExperiment = await this.despliegueExperimentoRepo.findOneBy({ id_experimento: id });
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

    async createDeploymentExperiment(data: CreateDespliegueExperimentoDto) {
        try {
            const deployment = await this.despliegueUtilsService.findOne(data.fk_id_despliegue);

            if (!deployment) {
                throw new NotFoundException(`Despliegue con id #${data.fk_id_despliegue} no se encuentra en la Base de Datos`);
            }

            const experiment = await this.experimentoService.findOne(data.fk_id_experimento);

            if (!experiment) {
                throw new NotFoundException(`Experimento con id #${data.fk_id_experimento} no se encuentra en la Base de Datos`);
            }

            const dirLoad = './utils/generate-load-k6';
            const nameImage = 'mimo1/load-k6:1.0.0';
            const ipCluster = '192.168.49.2'
            const url = `http://${ipCluster}:${deployment.puerto}`

            const buildCommand = `docker build -t ${nameImage} ${dirLoad}`;
            await this.executeCommand(buildCommand);
            console.log(`Imagen Docker construida correctamente`);

            console.log(`Genenerando carga en el microservicio que está en: ${url}`);

            const loadCommand = `docker run -e API_URL=${url} -e VUS=${experiment.cantidad_usuarios} -e DURATION=${experiment.duracion}s -e ENDPOINTS="/" -e DELIMITER="," ${nameImage}`
            await this.executeCommand(loadCommand);

        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException(
                `Problemas creando el experimento: ${error}`,
            );
        }
    }

    // async updateExperiment(id: number, cambios: UpdateDespliegueExperimentoDto) {
    //     try {
    //         const deployExperiment = await this.despliegueExperimentoRepo.findOneBy({ id_despliegue_experimento: id });
    //         // if (cambios.fk_estadoU) {
    //         //     const estado = await this.estadoUsuarioService.findOne(
    //         //         cambios.fk_estadoU,
    //         //     );
    //         //     user.estadoUsuario = estado;
    //         // }

    //         this.despliegueExperimentoRepo.merge(deployExperiment, cambios);
    //         return this.despliegueExperimentoRepo.save(deployExperiment);
    //     } catch (error) {
    //         console.error(error);
    //         throw new InternalServerErrorException(
    //             `Problemas actualizando el experimento: ${error}`,
    //         );
    //     }
    // }

    removeExperiment(id: number) {
        return this.despliegueExperimentoRepo.delete(id);
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
