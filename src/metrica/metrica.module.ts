import { Module } from '@nestjs/common';
import { MetricaService } from './services/metrica/metrica.service';
import { MetricaController } from './controllers/metrica/metrica.controller';
import { AtributoController } from './controllers/atributo/atributo.controller';
import { AtributoService } from './services/atributo/atributo.service';
import { Metrica } from './entities/metrica.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Atributo } from './entities/atributo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Metrica,
      Atributo,
    ])],
  providers: [MetricaService, AtributoService],
  controllers: [MetricaController, AtributoController]
})
export class MetricaModule {}
