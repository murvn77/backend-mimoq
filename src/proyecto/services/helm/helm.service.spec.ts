import { Test, TestingModule } from '@nestjs/testing';
import { HelmService } from './helm.service';

describe('HelmService', () => {
  let service: HelmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelmService],
    }).compile();

    service = module.get<HelmService>(HelmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
