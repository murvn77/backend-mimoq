import { Injectable, InternalServerErrorException, NotFoundException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { spawn } from 'child_process';
import { Repository } from 'typeorm';

import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { Response } from 'express';
import { CargaService } from '../carga/carga.service';
import { TableroService } from '../tablero/tablero.service';
import { DespliegueService } from '../../../proyecto/services/despliegue/despliegue.service';
import { Experimento } from '../../entities/experimento.entity';
import { MetricaService } from '../../../metrica/services/metrica/metrica.service';
import { CreateExperimentoDto, UpdateExperimentoDto } from '../../dtos/experimento.dto';
import { Despliegue } from '../../../proyecto/entities/despliegue.entity';
import { Metrica } from '../../../metrica/entities/metrica.entity';

@Injectable()
export class ExperimentoService {
  constructor(
    @InjectRepository(Experimento)
    private experimentoRepo: Repository<Experimento>,
    private despliegueUtilsService: DespliegueService,
    private metricaService: MetricaService,
    private cargaService: CargaService,
    private tableroService: TableroService,
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

  async findFiles(id: number, @Res() res: Response) {
    try {
      const experiment = await this.experimentoRepo.findOne({
        where: { id_experimento: id },
      });

      if (!(experiment instanceof Experimento)) {
        throw new NotFoundException(
          `Experimento con id #${id} no se encuentra en la Base de Datos`,
        );
      }

      const archivosPaths = experiment.nombres_archivos.map(nombre_archivo =>
        path.join(__dirname, '../../../../', `utils/resultados-experimentos/${experiment.nombre}`, nombre_archivo)
      );

      const archivosExistentes = archivosPaths.filter(archivoPath => fs.existsSync(archivoPath));

      if (archivosExistentes.length === 0) {
        throw new NotFoundException('No se encontraron archivos');
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=ResultadosBE`);

      const zip = archiver('zip');
      zip.pipe(res);

      archivosExistentes.forEach(archivoPath => {
        try {
          const nombre_archivo = path.basename(archivoPath);
          zip.append(fs.createReadStream(archivoPath), { name: nombre_archivo });
        } catch (error) {
          throw new Error(`Error al agregar archivo al zip: ${error}`);
        }
      });

      zip.finalize();

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
      const metricsHTTPToPanels = metrics.map(metric => metric.nombre_prometheus);
      console.log('METRICS HTTP TO PANELS: ', metricsHTTPToPanels)

      for (let i = 0; i < deployments.length; i++) {
        const nombres_archivos = await this.generateLoadAndManipulatePanels(metricsHTTPToPanels, deployments, load, data, directoryPath, i, newExperiment);
        if (!newExperiment.nombres_archivos) {
          newExperiment.nombres_archivos = []; // Inicializa la propiedad si aún no está definida
        }
        newExperiment.nombres_archivos = newExperiment.nombres_archivos.concat(nombres_archivos);
      }

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
    const panelesSeleccionados = this.filterPanels(metricsToPanels);
    this.writePanelJSON(panelesSeleccionados, load.duracion_total[i], deployments[i], i, directoryPath);

    const ipCluster = '127.0.0.1';
    const url = `http://${ipCluster}:${deployments[i].puerto}`;
    const dirLoad = './utils/generate-load-k6/load_test.js';
    console.log(`Generando carga en el microservicio que está en: ${url}`);
    const files: string[] = [];
    const nombres_archivos: string[] = [];

    await this.tableroService.loadDashboard(data.nombre, deployments[i].nombre);
    console.log('entra 0...');

    for (let j = 0; j < data.cant_replicas; j++) {
      console.log('entra...');
      const out = `${directoryPath}/results-${deployments[i].nombre}-${i}-replica-${j}.json`;
      console.log('entra...2');

      // const loadCommand = `K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write k6 run --out json=${out} -o experimental-prometheus-rw -e API_URL=${url} -e VUS="${load.cant_usuarios[i]}" -e DURATION="${load.duracion_picos[i]}" -e ENDPOINTS="${data.endpoints[j]}" -e DELIMITER="," -e SUMMARY="utils/resultados-experimentos/${data.nombre}/resultado-${deployments[i].nombre}.html" ${dirLoad}`;

      const loadCommand = `k6 run --out json=${out} -o experimental-prometheus-rw -e API_URL=${url} -e VUS="${load.cant_usuarios[i]}" -e DURATION="${load.duracion_picos[i]}" -e ENDPOINTS="${data.endpoints[j]}" -e DELIMITER="," -e SUMMARY="./utils/resultados-experimentos/${data.nombre}/resultado-${deployments[i].nombre}-replica-${j}.html" --tag testid=elpepe ${dirLoad}`;
      console.log('entra...3');

      await this.executeCommand(loadCommand);
      console.log('entra...4');

      // const contenidoJSON = fs.readFileSync(out, 'utf8');
      // files.push(contenidoJSON);
      console.log(`Generó carga. Microserivicio ${i + 1}, réplica ${j + 1}.`);
      nombres_archivos.push(`results-${deployments[i].nombre}-${i}-replica-${j}.json`);
      nombres_archivos.push(`resultado-${deployments[i].nombre}-replica-${j}.html`);
    }

    return nombres_archivos;
  }

  private filterPanels(metricsToPanels: string[]): any[] {
    const dataFile = fs.readFileSync('./utils/build-charts-dash/tmpl-panel.json', 'utf-8');
    const panels = JSON.parse(dataFile);
    const paneles = panels.filter((panel: any) => metricsToPanels.includes(panel.uid));
    return paneles;
  }

  private writePanelJSON(panels: any[], duracion: string, deployment: Despliegue, index: number, directoryPath: string) {
    const panelesSeleccionados = panels;
    fs.writeFile(`./utils/build-charts-dash/paneles-experiment.json`, JSON.stringify(panelesSeleccionados, null, 2), (err) => {
      if (err) {
        console.error('Error al guardar el service en el nuevo archivo JSON:', err);
        return;
      }
      console.log(`El nuevo archivo JSON con el service para el despliegue ${index} se ha creado correctamente.`);
      this.addTOJSONDash(index, panelesSeleccionados, duracion, deployment.nombre, directoryPath);
    });
  }

  private async addTOJSONDash(index: number, panelesSeleccionados: any, duracion: string, nombre: string, directoryPath: string) {
    try {

      console.log('DURATION: ', duracion)
      const dataDashboard = await fs.promises.readFile('./utils/build-charts-dash/tmpl-tablero.json', 'utf-8');
      const dashboard = JSON.parse(dataDashboard);
      dashboard.dashboard.title = `dash-${nombre}`;
      dashboard.dashboard.uid = `dash-${nombre}`;
      dashboard.dashboard.time.from = `now-${duracion}`;
      panelesSeleccionados.forEach((panel: any) => {
        dashboard.dashboard.panels.push(panel);
      });

      await fs.promises.writeFile(`${directoryPath}/dash-${nombre}.json`, JSON.stringify(dashboard, null, 2));
      console.log(`El nuevo archivo JSON del dashboard ${index} se creó correctamente`);
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
