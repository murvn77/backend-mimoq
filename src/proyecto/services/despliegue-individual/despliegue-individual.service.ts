/** NestJS */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Dtos */
import { CreateDeploymentDto } from 'src/proyecto/dtos/despliegue.dto';

/** Entities */
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Proyecto } from 'src/proyecto/entities/proyecto.entity';

/** Services */
import { ProyectoService } from '../proyecto/proyecto.service';

/** Utils */
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { exec } from 'child_process';
import { DespliegueService } from '../despliegue/despliegue.service';

/** Repositorio que tiene sólo un microservicio */
@Injectable()
export class DespliegueIndividualService {
    private nombresDespliegues: string[] = [];
    private puertosDespliegues: number[] = [];
    private puertosExposeApps: number[] = [];

    constructor(
        @InjectRepository(Despliegue)
        private despliegueRepo: Repository<Despliegue>,
        private despliegueUtilsService: DespliegueService,
        private proyectoService: ProyectoService,
    ) { }

    async validateProjectToDeploy(data: CreateDeploymentDto) {
        const proyecto = await this.proyectoService.findOne(data.fk_proyecto);

        if (!proyecto) {
            throw new InternalServerErrorException(`No se encontró el proyecto con id ${data.fk_proyecto}`);
        }

        const existingDeployment = await this.despliegueRepo.findOne({
            where: {
                // cant_replicas: data.cant_replicas,
                nombre: data.nombre,
                cant_pods: data.cant_pods,
                namespace: data.nombre,
                proyecto: proyecto
            }
        });

        if (existingDeployment) {
            throw new InternalServerErrorException(`Este despliegue ya está registrado en la base de datos`);
        }

        for (let i = 0; i < proyecto.urls_proyecto.length; i++) {
            const tempDir = `./utils/temp-repo-${Date.now()}`;
            await this.despliegueUtilsService.cloneRepository(proyecto.urls_proyecto[i], tempDir);

            const nombreCompletoImagen = `${proyecto.nombres_proyecto[i].toLowerCase().replace(/\s/g, '-')}`;

            const envMinikube = `eval $(minikube docker-env)`;
            await this.despliegueUtilsService.executeCommand(envMinikube);
            console.log(`Minikube trabaja con configuración local`);

            const buildCommand = `docker build -t ${nombreCompletoImagen} ${tempDir}`;
            await this.despliegueUtilsService.executeCommand(buildCommand);
            console.log(`Imagen Docker construida correctamente`);

            const loadImageMinikube = `minikube image load ${nombreCompletoImagen}`;
            await this.despliegueUtilsService.executeCommand(loadImageMinikube);
            console.log(`Imagen cargada en minikube correctamente`);

            const dockerfilePath = `${tempDir}/Dockerfile`;
            const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
            const portMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/);
            const port_expose = portMatch ? portMatch[1] : '';

            this.nombresDespliegues.push(nombreCompletoImagen);
            this.puertosDespliegues.push(await this.despliegueUtilsService.findAvailablePort());
            this.puertosExposeApps.push(port_expose);
        }

        return await this.createIndividualDeployment(proyecto, data);
    }

    async createIndividualDeployment(proyecto: Proyecto, data: CreateDeploymentDto) {
        const despliegueExitoso = await this.buildAndPushImage(data);

        const despliegues = [];

        console.log('Despliegue: ', despliegueExitoso)

        if (!despliegueExitoso) {
            throw new InternalServerErrorException(`No se pudo realizar el despliegue`);
        }

        console.log('Guardar cada deploy...')

        for (let i = 0; i < proyecto.urls_proyecto.length; i++) {
            const newDeployment = this.despliegueRepo.create(data);
            newDeployment.proyecto = proyecto;
            newDeployment.puerto = this.puertosDespliegues[i];
            newDeployment.label_despliegue_k8s = this.nombresDespliegues[i];
            try {
                await this.despliegueRepo.save(newDeployment)
            } catch (error) {
                throw new InternalServerErrorException(`Error al guardar el despliegue en la base de datos: ${error.message}`);
            }
            despliegues.push(newDeployment);
        }

        console.log('Despliegues: ', despliegues)

        if (despliegues != undefined) {
            return despliegues;
        } else {
            throw new InternalServerErrorException(`Despliegues vacíos!`);
        }
    }

    private async buildAndPushImage(data: CreateDeploymentDto): Promise<boolean> {
        try {
            let yamlContent = `namespace: ${data.namespace}
image:`;

            for (let i = 0; i < this.nombresDespliegues.length; i++) {
                yamlContent += `
  - name: ${this.nombresDespliegues[i]}
    portExpose: ${this.puertosExposeApps[i]}`;
            }

            yamlContent += `
nodePort:`;

            for (let i = 0; i < this.puertosDespliegues.length; i++) {
                yamlContent += `
  - ${this.puertosDespliegues[i]}`;
            }

            yamlContent += `
appName:`;

            for (let i = 0; i < this.nombresDespliegues.length; i++) {
                yamlContent += `
  - ${this.nombresDespliegues[i]}`;
            }

            yamlContent += `
cantReplicas:`;

            for (let i = 0; i < data.cant_replicas.length; i++) {
                yamlContent += `
  - ${data.cant_replicas[i]}`;
            }            

            this.nombresDespliegues = [];
            this.puertosDespliegues = [];
            this.puertosExposeApps = [];

            console.log('YML CONTENT: ', yamlContent);
            return await this.despliegueUtilsService.deployApp(data.nombre, yamlContent);
        } catch (error) {
            console.error(`Error en buildAndPushImage: ${error.message}`);
            return false;
        }
    }
}
