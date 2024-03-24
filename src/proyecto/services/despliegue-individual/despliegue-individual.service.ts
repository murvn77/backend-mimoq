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
    private nombreDespliegue: string;
    private puertoDespliegue: number;

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

        for (let i = 0; i < proyecto.urls_proyecto.length; i++) {
            const tempDir = `./utils/temp-repo-${Date.now()}`;
            await this.despliegueUtilsService.cloneRepository(proyecto.urls_proyecto[i], tempDir);
            await this.createIndividualDeployment(proyecto, data, tempDir, i);
        }
    }

    async createIndividualDeployment(proyecto: Proyecto, data: CreateDeploymentDto, tempDir: string, index: number) {
        const despliegueExitoso = await this.buildAndPushImage(proyecto, data, tempDir, index);

        if (!despliegueExitoso) {
            throw new InternalServerErrorException(`No se pudo realizar el despliegue`);
        }

        const newDeployment = this.despliegueRepo.create(data);
        newDeployment.proyecto = proyecto;
        newDeployment.puerto = this.puertoDespliegue;
        newDeployment.label_despliegue_k8s = this.nombreDespliegue;

        try {
            return await this.despliegueRepo.save(newDeployment);
        } catch (error) {
            throw new InternalServerErrorException(`Error al guardar el despliegue en la base de datos: ${error.message}`);
        }
    }

    private async buildAndPushImage(proyecto: Proyecto, data: CreateDeploymentDto, tempDir: string, index: number): Promise<boolean> {
        try {
            const localRegistry = 'localhost:5000';

            const nombreCompletoImagen = `${proyecto.nombres_proyecto[index].toLowerCase().replace(/\s/g, '-')}`;

            const envMinikube = `eval $(minikube docker-env)`;
            await this.despliegueUtilsService.executeCommand(envMinikube);
            console.log(`Minikube trabaja con configuración local`);

            const buildCommand = `docker build -t ${nombreCompletoImagen} ${tempDir}`;
            await this.despliegueUtilsService.executeCommand(buildCommand);
            console.log(`Imagen Docker construida correctamente`);

            // const tagCommand = `docker tag ${nombreCompletoImagen} ${localRegistry}/${nombreCompletoImagen}`;
            // await this.despliegueUtilsService.executeCommand(tagCommand);
            // console.log(`Imagen Docker etiquetada correctamente`);

            // const removeBuildCommand = `docker image rm ${nombreCompletoImagen}`;
            // await this.despliegueUtilsService.executeCommand(removeBuildCommand);
            // console.log(`Imagen Docker original eliminada correctamente`);

            // const pushCommand = `docker push ${localRegistry}/${nombreCompletoImagen}`;
            // await this.despliegueUtilsService.executeCommand(pushCommand);
            // console.log(`Imagen Docker subida correctamente al registry local`);

            const loadImageMinikube = `minikube image load ${nombreCompletoImagen}`;
            await this.despliegueUtilsService.executeCommand(loadImageMinikube);
            console.log(`Imagen cargada en minikube correctamente`);

            /** Leer el puerto expuesto del Dockerfile */
            const dockerfilePath = `${tempDir}/Dockerfile`;
            const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
            const portMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/);
            const port_expose = portMatch ? portMatch[1] : '';

            /** Costrucción de values para helm */
            const customValues = {
                appName: `${nombreCompletoImagen}`,
                namespace: `${data.nombre_namespace}`,
                cantReplicas: `${data.cant_replicas}`,
                name: `${nombreCompletoImagen}`,
                tag: `${data.tag_img}`,
                portExpose: `${port_expose}`,
                nodePort: `${await this.despliegueUtilsService.findAvailablePort()}`
            };

            this.nombreDespliegue = customValues.appName;
            this.puertoDespliegue = Number(customValues.nodePort);

            return await this.construirArchivoValues(customValues.appName, customValues);
        } catch (error) {
            console.error(`Error en buildAndPushImage: ${error.message}`);
            return false;
        }
    }

    /** Construcción de archivo "Values" para Helm */
    private async construirArchivoValues(nombreApp: string, customValues: any): Promise<boolean> {
        try {
            console.log('NOMBRE IMAGE: ', customValues.name);

            // Agregar la clave 'image' al objeto customValues
            const image = {
                name: customValues.name,
            };
            customValues.image = image;
            delete customValues.name;

            console.log('CUSTOM VALUES: ', customValues);

            // Generar el contenido YAML
            const yamlContent = yaml.dump(customValues);

            // Escribir el archivo YAML
            const dirValues = `./utils/values.yaml`;
            fs.writeFileSync(dirValues, yamlContent, 'utf8');

            console.log('Nombre de la aplicación para despliegue:', nombreApp);

            const helmCommand = `helm install ${nombreApp} ./utils/tmpl-deployment-helm --values ./utils/values.yaml`;

            return await new Promise<boolean>((resolve, reject) => {
                exec(helmCommand, async (error, stdout) => {
                    if (error) {
                        console.error(`Error al ejecutar creación de Helm: ${error.message}`);
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
}
