import { ConfigurationService } from "./ConfigurationService";

describe("ConfigurationService", () => {
  beforeEach(() => {
  })
  it("should give an error if the rootPath is empty", () => {
    const minimist = require('minimist');

    new ConfigurationService(minimist((process.argv.slice(2))));
    expect(ConfigurationService.instance.getWorkspacePath).toThrow();
  });
});
