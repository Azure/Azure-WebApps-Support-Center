import { TestBed } from '@angular/core/testing';

import { DiagnosticDataService } from './diagnostic-data.service';

describe('DiagnosticDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DiagnosticDataService = TestBed.get(DiagnosticDataService);
    expect(service).toBeTruthy();
  });
});
