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
import { DespliegueService } from '../despliegue/despliegue.service';

/** Intefaces para el despliegue con docker-compose */
interface ServiceConfig {
    image: string;
    container_name: string;
    ports: [''];
}
interface DockerComposeConfig {
    services: { [serviceName: string]: ServiceConfig };
}

@Injectable()
export class DespliegueMultipleService {
    private nombreDespliegue: string;
    private puertoDespliegue: number;

    constructor(
        @InjectRepository(Despliegue)
        private despliegueRepo: Repository<Despliegue>,
        private despliegueUtilsService: DespliegueService,
        private proyectoService: ProyectoService,
    ) { }

    /** Revisa si los microservicios están en un mismo repo o no */
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

        const tempDir = `./utils/temp-repo-${Date.now()}`;
        await this.despliegueUtilsService.cloneRepository(proyecto.url_proyecto, tempDir);

        if (proyecto.docker_compose) {
            if (proyecto.dockerfile) {
                this.recorrerCadaCarpetaDelRepoParaDockerfile(); // Mismo repositorio, cada ms con dockerfile
            } else {
                return await this.pullAndPushImageFromDockerCompose(proyecto, data, tempDir); // Mismo repositorio, dockercompose con imagenes en registry
            }
        }
    }

    async recorrerCadaCarpetaDelRepoParaDockerfile() {
        /** Impelemtación después */
    }

    /** Crear imágenes en el registro local si el repositorio tiene docker-compose */
    private async pullAndPushImageFromDockerCompose(proyecto: Proyecto, data: CreateDeploymentDto, tempDir: string) {
        try {
            const composeData = this.parseDockerCompose(`${tempDir}/docker-compose.yml`);
            const imagesToBuild = this.dockerImageParameters(composeData);

            return await this.pullImage(proyecto, imagesToBuild, data)
        } catch (error) {
            console.error(`Error en buildAndPushMultipleImage: ${error.message}`);
            return false;
        }
    }

    private parseDockerCompose(filePath: string): DockerComposeConfig {
        try {
            const composeData: DockerComposeConfig = yaml.load(fs.readFileSync(filePath, 'utf8')) as DockerComposeConfig;
            return composeData;
        } catch (error) {
            console.error(error);
            throw new Error('Error parsing docker-compose file');
        }
    }

    private dockerImageParameters(composeData: DockerComposeConfig): any[] {
        const kubernetesSpecs: any[] = [];
        for (const serviceName in composeData.services) {
            if (composeData.services.hasOwnProperty(serviceName)) {
                const serviceConfig = composeData.services[serviceName];
                const [port1,] = serviceConfig.ports[0].split(':').map(port => parseInt(port, 10));

                if (serviceConfig.image != undefined) {
                    const kubernetesSpec = {
                        name: serviceName,
                        image: serviceConfig.image,
                        port_expose: port1,
                    };
                    kubernetesSpecs.push(kubernetesSpec);
                }
            }
        }
        return kubernetesSpecs;
    }

    private async pullImage(proyecto: Proyecto, imagesToBuild: any[], data: CreateDeploymentDto) {
        const localRegistry = 'localhost:5000';
        let desplieguesRealizados: Despliegue[] = [];


        const envMinikube = `eval $(minikube docker-env)`;
        await this.despliegueUtilsService.executeCommand(envMinikube);
        console.log(`Minikube trabaja con configuración local`);

        for (const container of imagesToBuild) {

            const imageName = container.image;
            console.log(`Desplegando el contenedor con nombre: ${container.name}`)

            const pullCommand = `docker pull ${imageName}`;
            await this.despliegueUtilsService.executeCommand(pullCommand);
            console.log(`Haciendo pull de la imagen`);

            const loadImageMinikube = `minikube image load ${imageName}`;
            await this.despliegueUtilsService.executeCommand(loadImageMinikube);
            console.log(`Imagen cargada en minikube correctamente`);

            // const tagCommand = `docker tag ${imageName} ${localRegistry}/${imageName}`;
            // await this.executeCommand(tagCommand);
            // console.log(`Imagen Docker etiquetada correctamente`);

            // const removeBuildCommand = `docker image rm ${imageName}`;
            // await this.executeCommand(removeBuildCommand);
            // console.log(`Imagen Docker original eliminada correctamente`);

            // const pushCommand = `docker push ${localRegistry}/${imageName}`;
            // await this.executeCommand(pushCommand);
            // console.log(`Imagen Docker subida correctamente al registry local`);

            const index = imageName.indexOf("/");
            let nameApp = imageName.substring(index + 1);

            const customValues = {
                appName: `${nameApp}`,
                namespace: `${data.nombre_namespace}`,
                cantReplicas: `${data.cant_replicas}`,
                name: `${imageName}`,
                tag: `${data.tag_img}`,
                portExpose: `${container.port_expose}`,
                nodePort: `${await this.despliegueUtilsService.findAvailablePort()}`
            };

            this.nombreDespliegue = customValues.appName;

            nameApp = `${nameApp.toLowerCase().replace(/\s/g, '-')}`;
            this.puertoDespliegue = Number(customValues.nodePort);

            const despliegueExitoso = await this.despliegueUtilsService.construirArchivoValues(nameApp, customValues);

            if (!despliegueExitoso) {
                throw new InternalServerErrorException(`No se pudo realizar el despliegue`);
            }

            const newDeployment = this.despliegueRepo.create(data);
            newDeployment.proyecto = proyecto;
            newDeployment.label_despliegue_k8s = this.nombreDespliegue;
            newDeployment.puerto = this.puertoDespliegue;

            desplieguesRealizados.push(newDeployment);
        }

        for (const newDeployment of desplieguesRealizados) {
            try {
                await this.despliegueRepo.save(newDeployment);
            } catch (error) {
                throw new InternalServerErrorException(`Error al guardar el despliegue en la base de datos: ${error.message}`);
            }
        }
        console.log('Llega aquí')
        return desplieguesRealizados;
    }
}
