import { TestBed } from '@angular/core/testing';

import { ChangeAnalysisService } from './change-analysis.service';

describe('ChangeAnalysisService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ChangeAnalysisService = TestBed.get(ChangeAnalysisService);
    expect(service).toBeTruthy();
  });
});
