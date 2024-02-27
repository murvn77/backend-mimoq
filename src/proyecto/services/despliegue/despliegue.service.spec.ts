import { Test, TestingModule } from '@nestjs/testing';
import { DespliegueService } from './despliegue.service';

describe('DespliegueService', () => {
  let service: DespliegueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DespliegueService],
    }).compile();

    service = module.get<DespliegueService>(DespliegueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
