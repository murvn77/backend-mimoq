import { Module } from '@nestjs/common';
import { ExperimentoService } from './services/experimento/experimento.service';
import { ExperimentoController } from './controllers/experimento/experimento.controller';
import { Experimento } from './entities/experimento.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Experimento
    ]),
  ],
  providers: [ExperimentoService],
  controllers: [ExperimentoController],
  exports: [ExperimentoService]
})
export class ExperimentoModule {}
