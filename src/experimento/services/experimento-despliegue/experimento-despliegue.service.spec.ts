import { Test, TestingModule } from '@nestjs/testing';
import { ExperimentoDespliegueService } from './experimento-despliegue.service';

describe('DespliegueMetricaService', () => {
  let service: ExperimentoDespliegueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExperimentoDespliegueService],
    }).compile();

    service = module.get<ExperimentoDespliegueService>(ExperimentoDespliegueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
