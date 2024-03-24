import { Test, TestingModule } from '@nestjs/testing';
import { DespliegueExperimentoService } from './despliegue-experimento.service';

describe('DespliegueMetricaService', () => {
  let service: DespliegueExperimentoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DespliegueExperimentoService],
    }).compile();

    service = module.get<DespliegueExperimentoService>(DespliegueExperimentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
