import { TestBed } from '@angular/core/testing';

import { PortalActionService } from './portal-action.service';

describe('PortalActionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PortalActionService = TestBed.get(PortalActionService);
    expect(service).toBeTruthy();
  });
});
