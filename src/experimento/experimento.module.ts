import { Module } from '@nestjs/common';
import { ExperimentoService } from './services/experimento/experimento.service';
import { ExperimentoController } from './controllers/experimento/experimento.controller';
import { Experimento } from './entities/experimento.entity';

@Module({
  imports: [
    // TypeOrmModule.forFeature([
      Experimento
    // ]),
  ],
  providers: [ExperimentoService],
  controllers: [ExperimentoController],
})
export class ExperimentoModule {}
