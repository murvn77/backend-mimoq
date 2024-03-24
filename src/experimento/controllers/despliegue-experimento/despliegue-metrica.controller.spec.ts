import { Test, TestingModule } from '@nestjs/testing';
import { DespliegueExperimentoController } from './despliegue-metrica.controller';

describe('DespliegueMetricaController', () => {
  let controller: DespliegueExperimentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DespliegueExperimentoController],
    }).compile();

    controller = module.get<DespliegueExperimentoController>(DespliegueExperimentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
