import React, { useState, useEffect } from "react";
import { List, ActionPanel, Action, showToast, Toast, Icon, useNavigation, confirmAlert, Alert } from "@raycast/api";
import { getCurrentDeviceName, getAllDeviceConfigs, saveConfig } from "./utils/config";
import { Config, DeviceConfig } from "./types";
import DeviceForm from "./device-form";

interface FormData {
  deviceName: string;
  cliPath: string;
  projects: {
    id: string;
    name: string;
    path: string;
  }[];
}

export default function Configure() {
  const [devices, setDevices] = useState<Config>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const { push } = useNavigation();

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    try {
      setIsLoading(true);
      const config = getAllDeviceConfigs();
      setDevices(config);
    } catch (error) {
      console.error("Failed to load devices:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "加载失败",
        message: "无法加载设备配置",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddDevice() {
    setEditingDevice(null);
    push(
      <DeviceForm
        initialData={{
          deviceName: "",
          cliPath: "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
          projects: [],
        }}
        onSave={handleSaveDevice}
        onCancel={() => setEditingDevice(null)}
      />,
    );
  }

  async function handleEditDevice(deviceName: string) {
    const deviceConfig = devices[deviceName];
    if (!deviceConfig) return;

    setEditingDevice(deviceName);
    push(
      <DeviceForm
        initialData={{
          deviceName: deviceName,
          cliPath: deviceConfig.cliPath,
          projects: deviceConfig.projects,
        }}
        onSave={handleSaveDevice}
        onCancel={() => setEditingDevice(null)}
      />,
    );
  }

  async function handleSaveDevice(data: FormData) {
    try {
      const deviceConfig: DeviceConfig = {
        cliPath: data.cliPath,
        projects: data.projects,
      };

      // 更新设备配置
      const updatedDevices = { ...devices };

      // 如果是编辑现有设备且设备名发生变化，需要删除旧配置
      if (editingDevice && editingDevice !== data.deviceName) {
        delete updatedDevices[editingDevice];
      }

      updatedDevices[data.deviceName] = deviceConfig;
      setDevices(updatedDevices);

      // 保存到文件
      saveConfig(updatedDevices);

      await showToast({
        style: Toast.Style.Success,
        title: "保存成功",
        message: `设备 "${data.deviceName}" 配置已保存`,
      });

      setEditingDevice(null);
    } catch (error) {
      console.error("Failed to save device:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "保存失败",
        message: "无法保存设备配置",
      });
    }
  }

  async function handleDeleteDevice(deviceName: string) {
    const confirmed = await confirmAlert({
      title: "删除设备",
      message: `确定要删除设备 "${deviceName}" 及其所有项目配置吗？`,
      primaryAction: {
        title: "删除",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      const updatedDevices = { ...devices };
      delete updatedDevices[deviceName];
      setDevices(updatedDevices);

      // 保存到文件
      saveConfig(updatedDevices);

      await showToast({
        style: Toast.Style.Success,
        title: "删除成功",
        message: `设备 "${deviceName}" 已删除`,
      });
    }
  }

  if (isLoading) {
    return (
      <List isLoading={true}>
        <List.EmptyView title="加载中..." description="正在加载设备配置..." />
      </List>
    );
  }

  return (
    <List
      searchBarPlaceholder="搜索设备..."
      actions={
        <ActionPanel>
          <Action
            title="新增设备"
            icon={Icon.Plus}
            onAction={handleAddDevice}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </ActionPanel>
      }
    >
      {Object.entries(devices).map(([deviceName, deviceConfig]) => (
        <List.Item
          key={deviceName}
          icon={Icon.ComputerChip}
          title={deviceName}
          subtitle={`${deviceConfig.projects.length} 个项目`}
          accessories={[
            {
              text: deviceConfig.cliPath,
              icon: Icon.Gear,
            },
            ...(deviceName === getCurrentDeviceName()
              ? [
                  {
                    text: "当前设备",
                    icon: Icon.Info,
                  },
                ]
              : []),
          ]}
          actions={
            <ActionPanel>
              <Action title="编辑设备" icon={Icon.Pencil} onAction={() => handleEditDevice(deviceName)} />
              <Action
                title="新增设备"
                icon={Icon.Plus}
                onAction={handleAddDevice}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
              />
              <Action
                title="删除设备"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => handleDeleteDevice(deviceName)}
              />
              <Action.CopyToClipboard title="复制 Cli 路径" content={deviceConfig.cliPath} />
            </ActionPanel>
          }
        />
      ))}

      {Object.keys(devices).length === 0 && (
        <List.EmptyView
          icon={Icon.ComputerChip}
          title="暂无设备配置"
          description="点击下方 Actions 面板新增设备 (⌘N)"
          actions={
            <ActionPanel>
              <Action
                title="新增设备"
                icon={Icon.Plus}
                onAction={handleAddDevice}
                shortcut={{ modifiers: ["cmd"], key: "n" }}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
