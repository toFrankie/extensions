export interface Project {
  id: string;
  name: string;
  path: string;
}

export interface Config {
  [deviceId: string]: DeviceConfig;
}

export interface DeviceConfig {
  name: string;
  cliPath: string;
  projects: Project[];
}
