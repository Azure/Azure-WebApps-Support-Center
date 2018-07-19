import { StartupModule } from './startup.module';

describe('StartupModule', () => {
  let startupModule: StartupModule;

  beforeEach(() => {
    startupModule = new StartupModule();
  });

  it('should create an instance', () => {
    expect(startupModule).toBeTruthy();
  });
});
