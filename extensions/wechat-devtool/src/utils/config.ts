import { getApplications } from "@raycast/api";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { Config, DeviceConfig, Project } from "../types";
import { execSync } from "child_process";

const CONFIG_PATH = join(homedir(), ".config", "raycast-weapp.json");

export function getCurrentDeviceName(): string {
  try {
    return execSync("/usr/sbin/scutil --get ComputerName", { encoding: "utf8" }).trim();
  } catch (error) {
    console.error("Failed to get computer name:", error);
    return "Unknown Device";
  }
}

export function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_PATH)) {
      const content = readFileSync(CONFIG_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to load config:", error);
  }
  return {};
}

export function saveConfig(config: Config): void {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Failed to save config:", error);
    throw error;
  }
}

export function getCurrentDeviceConfig(): DeviceConfig | null {
  const currentDeviceName = getCurrentDeviceName();
  const deviceConfigs = loadConfig();

  // 查找当前设备名称对应的配置
  for (const [, deviceConfig] of Object.entries(deviceConfigs)) {
    if (deviceConfig.name === currentDeviceName) {
      return deviceConfig;
    }
  }

  // 如果没有找到，回退到 __default__ 设备
  for (const [, deviceConfig] of Object.entries(deviceConfigs)) {
    if (deviceConfig.name === "__default__") {
      return deviceConfig;
    }
  }

  // 如果都没有找到，返回默认配置
  return {
    name: currentDeviceName,
    cliPath: "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
    projects: [],
  };
}

export function getAllDeviceConfigs(): Config {
  return loadConfig();
}

export function getCurrentDeviceNameWithFallback(): string {
  const currentDeviceName = getCurrentDeviceName();
  const deviceConfigs = loadConfig();

  // 查找当前设备名称
  for (const [, deviceConfig] of Object.entries(deviceConfigs)) {
    if (deviceConfig.name === currentDeviceName) {
      return currentDeviceName;
    }
  }

  // 回退到 __default__ 设备
  for (const [, deviceConfig] of Object.entries(deviceConfigs)) {
    if (deviceConfig.name === "__default__") {
      return "__default__";
    }
  }

  return "__default__";
}

export function updateDeviceConfig(deviceId: string, deviceConfig: DeviceConfig): void {
  const config = loadConfig();
  config[deviceId] = deviceConfig;
  saveConfig(config);
}

export function addProjectToDevice(deviceId: string, project: Project): void {
  const config = loadConfig();
  if (!config[deviceId]) {
    config[deviceId] = { name: "", cliPath: "", projects: [] };
  }
  config[deviceId].projects.push(project);
  saveConfig(config);
}

export function removeProjectFromDevice(deviceId: string, projectId: string): void {
  const config = loadConfig();
  if (config[deviceId]) {
    config[deviceId].projects = config[deviceId].projects.filter((project) => project.id !== projectId);
    saveConfig(config);
  }
}

export function deleteDevice(deviceId: string): void {
  const config = loadConfig();
  if (config[deviceId]) {
    delete config[deviceId];
    saveConfig(config);
  }
}

export function isDeviceNameExists(deviceName: string, excludeDeviceId?: string): boolean {
  const config = loadConfig();
  for (const [deviceId, deviceConfig] of Object.entries(config)) {
    if (deviceConfig.name === deviceName && deviceId !== excludeDeviceId) {
      return true;
    }
  }
  return false;
}

export function getDeviceIdByName(deviceName: string): string | null {
  const config = loadConfig();
  for (const [deviceId, deviceConfig] of Object.entries(config)) {
    if (deviceConfig.name === deviceName) {
      return deviceId;
    }
  }
  return null;
}

export async function findWeChatDevtool(): Promise<string | null> {
  try {
    const applications = await getApplications();
    const wechatDevtool = applications.find(
      (app) => app.name.toLowerCase().includes("wechat") && app.name.toLowerCase().includes("devtool"),
    );
    if (wechatDevtool) {
      return `${wechatDevtool.path}/Contents/MacOS/cli`;
    }
  } catch (error) {
    console.error("Failed to find WeChat Devtool:", error);
  }
  return null;
}

export function generateProjectId(): string {
  return randomUUID();
}

export function generateDeviceId(): string {
  return randomUUID();
}
