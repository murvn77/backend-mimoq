import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { spawn } from 'child_process';

@Injectable()
export class TableroService {
  async createAPIKey() {
    try {
      const dashboardAPI = `curl -X POST -H "Content-Type: application/json" -d '{"name": "mi-api-key-2", "role": "Admin"}' http://admin:prom-operator@localhost:8080/api/auth/keys | jq -r '.key'`;
      await this.executeCommand(dashboardAPI);
    } catch (error) {
      console.error('Error al crear la clave de la API:', error);
    }
  }

  async loadDashboard(nombre_experimento: string, nombre_despliegue: string) {
    try {
      const basePath = `./utils/resultados-experimentos/${nombre_experimento}/dash-${nombre_despliegue}.json`;
      const loadDashboard = `curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${process.env.GRAFANA_PASSWORD}" --data @${basePath} http://admin:prom-operator@localhost:8080/api/dashboards/db`;
      await this.executeCommand(loadDashboard);

      console.log('Tablero creado...');
      await this.loadPanels(nombre_despliegue);
    } catch (error) {
      console.error('Error al cargar el tablero:', error);
    }
  }

  async loadPanels(nombre_despliegue: string) {
    try {
      // Obtener el UID del dashboard
      const dashboardSearchResponse = await axios.get(`http://admin:prom-operator@localhost:8080/api/search?query=dash-${nombre_despliegue}`, {
        headers: {
          Authorization: `Bearer ${process.env.GRAFANA_PASSWORD}`
        }
      });
      const dashboardUid = dashboardSearchResponse.data[0].uid;

      // Verificar si se encontró el dashboard
      if (!dashboardUid) {
        throw new Error('No se encontró el UID del dashboard');
      }

      // Obtener información de los paneles del dashboard
      const dashboardInfoResponse = await axios.get(`http://admin:prom-operator@localhost:8080/api/dashboards/uid/${dashboardUid}`, {
        headers: {
          Authorization: `Bearer ${process.env.GRAFANA_PASSWORD}`
        }
      });
      const panelsInfo = dashboardInfoResponse.data.dashboard.panels.map((panel: any) => panel.id);

      // Construir los iframes para cada panel
      const iframes = panelsInfo.map((panelId: string) =>
        `<iframe src="http://localhost:8080/d-solo/${dashboardUid}/panelexportatepls?orgId=1&refresh=5s&panelId=${panelId}" width="450" height="200" frameborder="0"></iframe>`
      );
      console.log('Paneles cargados:', iframes);
    } catch (error) {
      console.error('Error al cargar los paneles:', error);
    }
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
          reject(new Error(`El comando finalizó con el código ${code}`));
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}
