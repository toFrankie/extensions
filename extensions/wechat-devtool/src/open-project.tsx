import React, { useState, useEffect } from "react";
import { List, ActionPanel, Action, showToast, Toast, Icon, closeMainWindow, useNavigation } from "@raycast/api";
import {
  getCurrentDeviceConfig,
  getCurrentDeviceName,
  getCurrentDeviceNameWithFallback,
  getAllDeviceConfigs,
} from "./utils/config";
import { openProject } from "./utils/cli";
import { Project, DeviceConfig } from "./types";
import Configure from "./configure";

export default function OpenProject() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [currentDeviceName, setCurrentDeviceName] = useState("");
  const [effectiveDeviceName, setEffectiveDeviceName] = useState("");
  const [hasConfigurationError, setHasConfigurationError] = useState(false);
  const { push } = useNavigation();

  useEffect(() => {
    const allDevices = getAllDeviceConfigs();
    const deviceEntries = Object.entries(allDevices);
    const deviceList = deviceEntries.map(([, d]) => d);
    const hasNoDevice = deviceList.length === 0;

    if (hasNoDevice) {
      push(<Configure />);
      return;
    }
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setIsLoading(true);
      const config = getCurrentDeviceConfig();
      const deviceName = getCurrentDeviceName();
      const effectiveDevice = getCurrentDeviceNameWithFallback();

      if (!config) {
        setHasConfigurationError(true);
        setCurrentDeviceName(deviceName);
        setEffectiveDeviceName(deviceName);
        setProjects([]);
        return;
      }

      setDeviceConfig(config);
      setCurrentDeviceName(deviceName);
      setEffectiveDeviceName(effectiveDevice);
      setProjects(config?.projects || []);
      setHasConfigurationError(false);
    } catch (error) {
      console.error("Failed to load projects:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "加载失败",
        message: "无法加载项目配置",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenProject(project: Project) {
    const result = await openProject(deviceConfig!.cliPath, project.path);

    if (result.success) {
      await showToast({
        style: Toast.Style.Success,
        title: "✅ 成功",
        message: `已打开项目: ${project.name}`,
      });
      await closeMainWindow();
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "❌ 失败",
        message: result.error || "打开项目失败",
      });
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.path.toLowerCase().includes(searchText.toLowerCase()),
  );

  if (isLoading) {
    return (
      <List isLoading={true}>
        <List.EmptyView title="加载中..." description="正在加载项目配置..." />
      </List>
    );
  }

  if (hasConfigurationError) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="设备未配置"
          description={`当前设备 "${currentDeviceName}" 未在配置中找到。请使用"Configure Extension"命令进行配置。`}
          actions={
            <ActionPanel>
              <Action
                title="打开配置界面"
                icon={Icon.Gear}
                onAction={() => {
                  push(<Configure />);
                }}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (projects.length === 0) {
    const deviceInfo =
      currentDeviceName === effectiveDeviceName
        ? `当前设备 "${currentDeviceName}"`
        : `当前设备 "${currentDeviceName}" (使用默认设备 "${effectiveDeviceName}" 的配置)`;

    return (
      <List searchBarPlaceholder="搜索项目...">
        <List.EmptyView
          icon={Icon.Folder}
          title="暂无项目"
          description={`${deviceInfo} 下没有配置任何项目`}
          actions={
            <ActionPanel>
              <Action
                title="打开配置界面"
                icon={Icon.Gear}
                onAction={() => {
                  push(<Configure />);
                }}
                shortcut={{ modifiers: [], key: "return" }}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List searchBarPlaceholder="搜索项目..." onSearchTextChange={setSearchText} isLoading={isLoading}>
      {filteredProjects.map((project) => (
        <List.Item
          key={project.id}
          icon={Icon.Folder}
          title={project.name}
          subtitle={project.path}
          accessories={
            currentDeviceName !== effectiveDeviceName
              ? [{ text: `使用设备 "${effectiveDeviceName}" 配置`, icon: Icon.Info }]
              : []
          }
          actions={
            <ActionPanel>
              <Action
                title="打开项目"
                icon={Icon.Play}
                onAction={() => handleOpenProject(project)}
                shortcut={{ modifiers: [], key: "return" }}
              />
              <Action title="打开配置界面" icon={Icon.Gear} onAction={() => push(<Configure />)} />
              <Action.CopyToClipboard title="复制项目名称" content={project.name} />
              <Action.CopyToClipboard title="复制项目路径" content={project.path} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
