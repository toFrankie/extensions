import { getApplications } from "@raycast/api";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { Config, DeviceConfig, Project } from "../types";

const CONFIG_PATH = join(homedir(), ".config", "raycast-weapp.json");

export function getCurrentDeviceName(): string {
  try {
    // return execSync("/usr/sbin/scutil --get ComputerName", { encoding: "utf8" }).trim();
    return "Frankie's-iMac".trim();
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
  let deviceConfig = deviceConfigs[currentDeviceName];
  if (!deviceConfig) {
    // 只回退到 __default__，否则返回 null
    deviceConfig = deviceConfigs["__default__"];
  }
  if (!deviceConfig) {
    deviceConfig = {
      cliPath: "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
      projects: [],
    };
  }
  return deviceConfig;
}

export function getAllDeviceConfigs(): Config {
  return loadConfig();
}

export function getCurrentDeviceNameWithFallback(): string {
  const currentDeviceName = getCurrentDeviceName();
  const deviceConfigs = loadConfig();
  if (deviceConfigs[currentDeviceName]) {
    return currentDeviceName;
  }
  // 只回退到 __default__
  return "__default__";
}

export function updateDeviceConfig(deviceName: string, deviceConfig: DeviceConfig): void {
  const config = loadConfig();
  config[deviceName] = deviceConfig;
  saveConfig(config);
}

export function addProjectToDevice(deviceName: string, project: Project): void {
  const config = loadConfig();
  if (!config[deviceName]) {
    config[deviceName] = { cliPath: "", projects: [] };
  }
  config[deviceName].projects.push(project);
  saveConfig(config);
}

export function removeProjectFromDevice(deviceName: string, projectId: string): void {
  const config = loadConfig();
  if (config[deviceName]) {
    config[deviceName].projects = config[deviceName].projects.filter((project) => project.id !== projectId);
    saveConfig(config);
  }
}

export function deleteDevice(deviceName: string): void {
  const config = loadConfig();
  if (config[deviceName]) {
    delete config[deviceName];
    saveConfig(config);
  }
}

export async function findWechatDevtool(): Promise<string | null> {
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
