export interface Project {
  id: string;
  name: string;
  path: string;
}

export interface Config {
  [deviceName: string]: DeviceConfig;
}

export interface DeviceConfig {
  cliPath: string;
  projects: Project[];
}
