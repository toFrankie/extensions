import React, { useState, useEffect } from "react";
import { List, ActionPanel, Action, showToast, Toast, Icon, closeMainWindow } from "@raycast/api";
import { getCurrentDeviceConfig, getCurrentDeviceName, getCurrentDeviceNameWithFallback } from "./utils/config";
import { openProject } from "./utils/cli";
import { Project, DeviceConfig } from "./types";

export default function OpenProject() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [currentDeviceName, setCurrentDeviceName] = useState("");
  const [effectiveDeviceName, setEffectiveDeviceName] = useState("");
  const [hasConfigurationError, setHasConfigurationError] = useState(false);

  useEffect(() => {
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
    if (!deviceConfig?.cliPath) {
      await showToast({
        style: Toast.Style.Failure,
        title: "❌ 失败",
        message: "CLI 路径未配置，请在配置界面中设置",
      });
      return;
    }

    const result = await openProject(deviceConfig.cliPath, project.path);

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
                  // 这里可以添加导航到配置界面的逻辑
                  console.log("Navigate to configure");
                }}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (!deviceConfig?.cliPath) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="CLI 路径未配置"
          description="请在配置界面中设置微信开发者工具 CLI 路径"
          actions={
            <ActionPanel>
              <Action
                title="打开配置界面"
                icon={Icon.Gear}
                onAction={() => {
                  // 这里可以添加导航到配置界面的逻辑
                  console.log("Navigate to configure");
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
                  // 这里可以添加导航到配置界面的逻辑
                  console.log("Navigate to configure");
                }}
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
          accessories={[
            {
              text: effectiveDeviceName,
              icon: Icon.ComputerChip,
            },
            ...(currentDeviceName !== effectiveDeviceName
              ? [
                  {
                    text: "使用默认配置",
                    icon: Icon.Info,
                  },
                ]
              : []),
          ]}
          actions={
            <ActionPanel>
              <Action title="打开项目" icon={Icon.Play} onAction={() => handleOpenProject(project)} />
              <Action.CopyToClipboard
                title="复制项目路径"
                content={project.path}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.OpenInBrowser
                title="在访达中显示"
                url={`file://${project.path}`}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
