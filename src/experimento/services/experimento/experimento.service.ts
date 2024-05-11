import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { exec, spawn } from 'child_process';
import { Repository } from 'typeorm';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';

import * as fs from 'fs';
import * as path from 'path';
import { CreateExperimentoDto, UpdateExperimentoDto } from 'src/experimento/dtos/experimento.dto';
import { MetricaService } from 'src/metrica/services/metrica/metrica.service';
import { CargaService } from '../carga/carga.service';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { Metrica } from 'src/metrica/entities/metrica.entity';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { Console } from 'console';

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
      const basePath = './utils/resultados-experimentos';
      let nombres_archivos: string[] = [];
      let files: string[];
      const newExperiment = this.experimentoRepo.create(data);
      const formattedName = data.nombre.toLowerCase().replace(/\s+/g, '-');

      const directoryPath = path.join(basePath, formattedName);

      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
        console.log(`Directorio '${formattedName}' creado en '${basePath}'.`);
      } else {
        console.log(`El directorio '${formattedName}' ya existe en '${basePath}'.`);
      }

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
      const { stdout, stderr } = await this.despliegueUtilsService.executeCommand(buildCommand);
      const numberOfRunningPods = parseInt(stdout.trim()); // Convertir la salida a un número entero
      console.log(`Número de pods en estado "Running": ${numberOfRunningPods}`);

      const metricsToPanels = metrics.map(metric => metric.nombre);

      console.log('METRICS TO PANELS: ', metricsToPanels)

      for (let i = 0; i < deployments.length; i++) {
        // Resto del código...
        const nombres_archivos = await this.generateLoadAndManipulatePanels(metricsToPanels, deployments, load, data, directoryPath, i, newExperiment);
        console.log('se queda aquí... i');
        if (!newExperiment.nombres_archivos) {
          newExperiment.nombres_archivos = []; // Inicializa la propiedad si aún no está definida
        }
        newExperiment.nombres_archivos = newExperiment.nombres_archivos.concat(nombres_archivos);

      }

      console.log('NEW EXPERIMENT: 2 ', newExperiment.nombres_archivos);

      newExperiment.despliegues = deployments;
      newExperiment.metricas = metrics;;
      newExperiment.carga = load;

      return this.experimentoRepo.save(newExperiment);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Problemas creando el experimento: ${error}`,
      );
    }
  }

  private async generateLoadAndManipulatePanels(metricsToPanels: string[], deployments: Despliegue[], load: any, data: CreateExperimentoDto, directoryPath: string, i: number, newExperiment: Experimento) {
    const ipCluster = '192.168.49.2';
    const url = `http://${ipCluster}:${deployments[i].puerto}`;
    const dirLoad = './utils/generate-load-k6/load_test.js';
    console.log(`Generando carga en el microservicio que está en: ${url}`);
    const files: string[] = [];
    const nombres_archivos: string[] = [];
    for (let j = 0; j < data.cant_replicas; j++) {
      const out = `${directoryPath}/test-results-${deployments[i].nombre}-${i}-replica-${j}.json`;
      const loadCommand = `k6 run --out json=${out} -e API_URL=${url} -e VUS="${load.cant_usuarios[i]}" -e DURATION="${load.duracion_picos[i]}" -e ENDPOINTS="${data.endpoints[j]}" -e DELIMITER="," -e SUMMARY="resultado-${deployments[i].nombre}-2.html" ${dirLoad}`;

      console.log("LOAD COMMAND: ", loadCommand);
      await this.executeCommand(loadCommand);
      const contenidoJSON = fs.readFileSync(out, 'utf8');
      files.push(contenidoJSON);
      console.log(`Generó carga. Réplica ${i + 1} del experimento terminada.`);
      nombres_archivos.push(`test-results-${deployments[i].nombre}-${i}-replica-${j}.json`);
    }

    const panelesSeleccionados = this.filterPanels(metricsToPanels, deployments[i].nombre);
    this.updatePanelTargets(panelesSeleccionados, deployments[i]);
    this.writePanelJSON(panelesSeleccionados, deployments[i], i);

    return nombres_archivos;
  }

  private filterPanels(metricsToPanels: string[], deploymentName: string): any[] {
    const dataFile = fs.readFileSync('./utils/build-charts-dash/tmpl-panel.json', 'utf-8');
    const panels = JSON.parse(dataFile);
    return panels.filter((panel: any) => metricsToPanels.includes(panel.uid));
  }

  private updatePanelTargets(panels: any[], deployment: Despliegue) {
    panels.forEach(panel => {
      panel.targets[0].expr = `${deployment.nombre}{service="${deployment.nombre}"}`;
    });
  }

  private writePanelJSON(panels: any[], deployment: Despliegue, index: number) {
    const nuevoJSON = JSON.stringify(panels, null, 2);
    fs.writeFile(`./utils/build-charts-dash/paneles-${deployment.nombre}-${index}.json`, nuevoJSON, (err) => {
      if (err) {
        console.error('Error al guardar el service en el nuevo archivo JSON:', err);
        return;
      }
      console.log(`El nuevo archivo JSON con el service para el despliegue ${index} se ha creado correctamente.`);
    });
    this.addTOJSONDash(index, panels, deployment.nombre);
  }


  private async addTOJSONDash(index: number, panelesSeleccionados: any[], nombre: string) {
    try {
      const dataDashboard = await fs.promises.readFile('./utils/build-charts-dash/tmpl-tablero.json', 'utf-8');
      const dashboard = JSON.parse(dataDashboard);
      if (!dashboard.hasOwnProperty('panels')) {
        dashboard.panels = [];
      }
      dashboard.panels.push(...panelesSeleccionados);
      const nuevoDashboard = JSON.stringify(dashboard, null, 2);
      await fs.promises.writeFile(`./utils/build-charts-dash/dash-${nombre}-${index}.json`, nuevoDashboard);
      console.log(`El nuevo archivo JSON del dashboard ${index} se creó correctamente`);
      console.log('se queda aquí? ')
    } catch (error) {
      console.error('Error al manipular archivos JSON:', error);
    }
  }


  async updateExperiment(id: number, cambios: UpdateExperimentoDto) {
    try {
      const deployExperiment = await this.experimentoRepo.findOneBy({ id_experimento: id });

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

      const childProcess = spawn(command, { shell: true });

      childProcess.on('error', (error) => {
        reject(error);
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        stdout += data;
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data;
      });

      childProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Command exited with code ${code}`));
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}
