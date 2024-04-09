import { Module } from '@nestjs/common';
import { MetricaService } from './services/metrica/metrica.service';
import { MetricaController } from './controllers/metrica/metrica.controller';
import { AtributoController } from './controllers/atributo/atributo.controller';
import { AtributoService } from './services/atributo/atributo.service';
import { Metrica } from './entities/metrica.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atributo } from './entities/atributo.entity';
import { Experimento } from 'src/experimento/entities/experimento.entity';
import { ExperimentoService } from 'src/experimento/services/experimento/experimento.service';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';
import { Carga } from 'src/experimento/entities/carga.entity';
import { CargaService } from 'src/experimento/services/carga/carga.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Metrica,
      Atributo,
      Experimento,
      Despliegue,
      Carga
    ])],
  providers: [MetricaService, AtributoService, ExperimentoService, DespliegueService, CargaService],
  controllers: [MetricaController, AtributoController]
})
export class MetricaModule {}
