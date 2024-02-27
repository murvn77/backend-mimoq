// helm.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { Proyecto } from 'src/proyecto/entities/proyecto.entity';

@Injectable()
export class HelmService {
  async construirImagen(proyecto: Proyecto, data: any, tempDir: string): Promise<string> {
    const localRegistry = 'localhost:5000';
    const nombreCompletoImagen = `${data.usuario_img}/${data.nombre_img}:${data.tag_img}`;

    // Aquí iría la lógica para construir y subir la imagen Docker

    const nombreApp = `${proyecto.titulo.toLowerCase().replace(/\s/g, '-')}`;
    console.log('NombreAPP', nombreApp);

    // Aquí iría la lógica para construir y subir el despliegue de Helm

    return nombreApp;
  }
}
