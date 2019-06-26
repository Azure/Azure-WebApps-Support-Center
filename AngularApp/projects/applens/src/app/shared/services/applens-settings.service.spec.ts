import { TestBed } from '@angular/core/testing';

import { ApplensSettingsService } from './applens-settings.service';

describe('ApplensSettingsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ApplensSettingsService = TestBed.get(ApplensSettingsService);
    expect(service).toBeTruthy();
  });
});
