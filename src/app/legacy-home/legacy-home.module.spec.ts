import { LegacyHomeModule } from './legacy-home.module';

describe('LegacyHomeModule', () => {
  let legacyHomeModule: LegacyHomeModule;

  beforeEach(() => {
    legacyHomeModule = new LegacyHomeModule();
  });

  it('should create an instance', () => {
    expect(legacyHomeModule).toBeTruthy();
  });
});
