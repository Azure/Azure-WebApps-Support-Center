import { WebSitesModule } from './web-sites.module';

describe('WebSitesModule', () => {
  let webSitesModule: WebSitesModule;

  beforeEach(() => {
    webSitesModule = new WebSitesModule();
  });

  it('should create an instance', () => {
    expect(webSitesModule).toBeTruthy();
  });
});
