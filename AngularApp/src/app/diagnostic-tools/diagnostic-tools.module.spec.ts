import { DiagnosticToolsModule } from './diagnostic-tools.module';

describe('DiagnosticToolsModule', () => {
  let diagnosticToolsModule: DiagnosticToolsModule;

  beforeEach(() => {
    diagnosticToolsModule = new DiagnosticToolsModule();
  });

  it('should create an instance', () => {
    expect(diagnosticToolsModule).toBeTruthy();
  });
});
