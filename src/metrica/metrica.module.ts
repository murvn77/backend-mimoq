import { Module } from '@nestjs/common';
import { MetricaService } from './services/metrica/metrica.service';
import { MetricaController } from './controllers/metrica/metrica.controller';

@Module({
  providers: [MetricaService],
  controllers: [MetricaController]
})
export class MetricaModule {}
