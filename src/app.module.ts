import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExperimentoModule } from './experimento/experimento.module';
import { DespliegueModule } from './despliegue/despliegue.module';

@Module({
  imports: [ExperimentoModule, DespliegueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
