export type Project = {
  id: string;
  name: string;
  path: string;
};

export type DeviceConfig = {
  cliPath: string;
  projects: Project[];
};

export type AllConfig = Record<string, DeviceConfig>;
