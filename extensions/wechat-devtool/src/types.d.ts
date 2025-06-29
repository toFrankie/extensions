export interface Project extends Record<string, unknown> {
  id: string;
  name: string;
  path: string;
}

export interface DeviceConfig {
  name: string;
  cliPath: string;
  projects: Project[];
}

export interface Config {
  [deviceId: string]: DeviceConfig;
}

export interface WechatProjectConfig {
  projectname?: string;
  appid?: string;
  miniprogramRoot?: string;
  qcloudRoot?: string;
  pluginRoot?: string;
  cloudbaseRoot?: string;
  cloudfunctionRoot?: string;
  cloudfunctionTemplateRoot?: string;
  cloudcontainerRoot?: string;
  compileType?: string;
  setting?: Record<string, unknown>;
  libVersion?: string;
  packOptions?: Record<string, unknown>;
  debugOptions?: Record<string, unknown>;
  watchOptions?: Record<string, unknown>;
  scripts?: Record<string, unknown>;
  staticServerOptions?: Record<string, unknown>;
  editorSetting?: Record<string, unknown>;
  skeletonConfig?: Record<string, unknown>;
}

export interface FormErrors {
  deviceName?: string;
  cliPath?: string;
  projects?: { name?: string; path?: string }[];
}

export interface OperationResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface DeviceOperationResult extends OperationResult {
  deviceId?: string;
  deviceName?: string;
}

export interface ProjectOperationResult extends OperationResult {
  projectId?: string;
  projectName?: string;
}

export interface CliResult extends OperationResult {
  stdout?: string;
  stderr?: string;
  code?: number;
}

export interface FileSystemResult extends OperationResult {
  path?: string;
  exists?: boolean;
}

export interface DeviceFormProps {
  initialData?: Partial<DeviceConfig> & { id?: string };
  onSuccess?: () => void;
}

export interface ProjectListProps {
  onProjectAction: (project: Project, deviceConfig: DeviceConfig) => void;
  requiredFields?: string[];
  actionPanelExtra?: React.ReactNode;
}

export interface ErrorTimeoutRef {
  [key: string]: NodeJS.Timeout;
}

export interface DeviceMatchResult {
  currentDeviceName: string;
  effectiveDeviceName: string;
  deviceConfig: DeviceConfig | null;
  hasConfigurationError: boolean;
}
