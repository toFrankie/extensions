import React, { useState, useEffect } from "react";
import { List, ActionPanel, Action, Icon, useNavigation } from "@raycast/api";
import { getAllDeviceConfigs, getCurrentDeviceName } from "../utils/config";
import { Project, DeviceConfig } from "../types";
import DeviceForm from "./device-form";
import Configure from "../configure";

interface ProjectListProps {
  onProjectAction: (project: Project, deviceConfig: DeviceConfig) => void;
  requiredFields?: string[];
  actionPanelExtra?: React.ReactNode;
}

export default function ProjectList({
  onProjectAction,
  requiredFields = ["name", "path"],
  actionPanelExtra,
}: ProjectListProps) {
  const { push } = useNavigation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [currentDeviceName, setCurrentDeviceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  function loadProjects() {
    setIsLoading(true);
    const allDevices = getAllDeviceConfigs();
    const deviceName = getCurrentDeviceName();
    let config: DeviceConfig | null = null;
    for (const [, d] of Object.entries(allDevices)) {
      if (d.name === deviceName) {
        config = d;
        break;
      }
    }
    if (!config) {
      for (const [, d] of Object.entries(allDevices)) {
        if (d.name === "__default__") {
          config = d;
          break;
        }
      }
    }
    setDeviceConfig(config);
    setCurrentDeviceName(deviceName);
    setProjects(config?.projects || []);
    setIsLoading(false);
  }

  if (!deviceConfig) {
    return (
      <List isLoading={isLoading} searchBarPlaceholder="搜索项目...">
        <List.EmptyView
          icon={Icon.Devices}
          title="未配置设备"
          description="请先添加设备配置"
          actions={
            <ActionPanel>
              <Action
                title="新增设备"
                icon={Icon.Plus}
                onAction={() =>
                  push(<DeviceForm initialData={{ name: "", cliPath: "", projects: [] }} onSuccess={loadProjects} />)
                }
                shortcut={{ modifiers: [], key: "return" }}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const deviceNameMismatch = currentDeviceName !== deviceConfig.name;

  const missingFieldProject = projects.find((p) => requiredFields.some((f) => !p[f]));

  if (projects.length === 0) {
    return (
      <List searchBarPlaceholder="搜索项目...">
        <List.EmptyView
          icon={Icon.Folder}
          title="暂无项目"
          description={`当前设备 "${currentDeviceName}" (${deviceNameMismatch ? `使用设备 "${deviceConfig.name}" 配置` : ""}) 下没有配置任何项目`}
          actions={
            <ActionPanel>
              <Action
                title="前往配置页"
                icon={Icon.Gear}
                onAction={() => push(<Configure />)}
                shortcut={{ modifiers: [], key: "return" }}
              />
              {actionPanelExtra}
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (missingFieldProject) {
    return (
      <List searchBarPlaceholder="搜索项目...">
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="项目配置不完整"
          description={`有项目缺少必填项：${requiredFields.join(", ")}`}
          actions={
            <ActionPanel>
              <Action
                title="前往配置页"
                icon={Icon.Gear}
                onAction={() => push(<Configure />)}
                shortcut={{ modifiers: [], key: "return" }}
              />
              {actionPanelExtra}
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="搜索项目...">
      {projects.map((project) => (
        <List.Item
          key={project.id}
          icon={Icon.Folder}
          title={project.name}
          subtitle={project.path}
          accessories={deviceNameMismatch ? [{ text: `使用设备 "${deviceConfig.name}" 配置`, icon: Icon.Info }] : []}
          actions={
            <ActionPanel>
              <Action
                title="执行操作"
                icon={Icon.Play}
                onAction={() => onProjectAction(project, deviceConfig)}
                shortcut={{ modifiers: [], key: "return" }}
              />
              <Action title="前往配置页" icon={Icon.Gear} onAction={() => push(<Configure />)} />
              {actionPanelExtra}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
