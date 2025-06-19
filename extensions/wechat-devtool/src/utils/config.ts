import { homedir } from "os";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import { Project, DeviceConfig, AllConfig } from "../types";

const CONFIG_PATH = `${homedir()}/.config/raycast-weapp.json`;

export async function loadConfig(): Promise<AllConfig> {
  try {
    const content = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(content);
  } catch (e) {
    // Return default structure if file does not exist
    return {
      __default__: { cliPath: "", projects: [] },
    };
  }
}

export async function saveConfig(cfg: AllConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}

export function currentDeviceName(): string {
  try {
    return execSync("scutil --get ComputerName").toString().trim();
  } catch {
    return "__default__";
  }
}

export function getCurrentDeviceConfig(cfg: AllConfig): DeviceConfig {
  const name = currentDeviceName();
  return cfg[name] ?? cfg["__default__"];
}
