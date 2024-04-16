import { appChrome } from '~/__tests__/cypress/cypress/pages/appChrome';

describe('App launcher', () => {
  beforeEach(() => {
    appChrome.visit();
  });

  it('Validate clicking on App Launcher opens menu', () => {
    const applicationLauncher = appChrome.getApplicationLauncher();
    applicationLauncher.toggleAppLauncherButton();
    const applicationLauncherMenuGroup = applicationLauncher.getApplicationLauncherMenuGroup(
      'Open Data Hub Applications',
    );
    applicationLauncherMenuGroup.shouldHaveApplicationLauncherItem('OpenShift Cluster Manager');
    applicationLauncher.toggleAppLauncherButton();
  });
});
