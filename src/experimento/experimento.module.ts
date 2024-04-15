import { Module } from '@nestjs/common';
import { ExperimentoService } from './services/experimento/experimento.service';
import { ExperimentoController } from './controllers/experimento/experimento.controller';
import { Experimento } from './entities/experimento.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DespliegueService } from 'src/proyecto/services/despliegue/despliegue.service';
import { Despliegue } from 'src/proyecto/entities/despliegue.entity';
import { CargaController } from './controllers/carga/carga.controller';
import { CargaService } from './services/carga/carga.service';
import { Atributo } from 'src/metrica/entities/atributo.entity';
import { Metrica } from 'src/metrica/entities/metrica.entity';
import { MetricaService } from 'src/metrica/services/metrica/metrica.service';
import { Carga } from './entities/carga.entity';
import { AtributoService } from 'src/metrica/services/atributo/atributo.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Experimento,
      Carga,
      Despliegue,
      Metrica,
      Atributo
    ]),
  ],
  providers: [ExperimentoService, CargaService, DespliegueService, MetricaService, AtributoService],
  controllers: [ExperimentoController, CargaController],
})
export class ExperimentoModule {}
