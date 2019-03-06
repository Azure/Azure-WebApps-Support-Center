import { TestBed } from '@angular/core/testing';

import { DiagnosticSiteService } from './diagnostic-site.service';

describe('DiagnosticSiteService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DiagnosticSiteService = TestBed.get(DiagnosticSiteService);
    expect(service).toBeTruthy();
  });
});
