import React, { useState, useEffect } from "react";
import { List, ActionPanel, Action, showToast, Toast, Icon, useNavigation, confirmAlert, Alert } from "@raycast/api";
import { getCurrentDeviceName, getAllDeviceConfigs, saveConfig } from "./utils/config";
import DeviceForm from "./components/device-form";
import { Config } from "./types";

export default function Configure() {
  const [devices, setDevices] = useState<Config>({});
  const [isLoading, setIsLoading] = useState(false);
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
    push(
      <DeviceForm
        initialData={{
          cliPath: "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
          projects: [],
        }}
        onSuccess={loadDevices}
      />,
    );
  }

  async function handleEditDevice(deviceId: string) {
    const deviceConfig = devices[deviceId];
    if (!deviceConfig) return;
    push(
      <DeviceForm
        initialData={{
          id: deviceId,
          name: deviceConfig.name,
          cliPath: deviceConfig.cliPath,
          projects: deviceConfig.projects,
        }}
        onSuccess={loadDevices}
      />,
    );
  }

  async function handleDeleteDevice(deviceId: string) {
    const deviceConfig = devices[deviceId];
    if (!deviceConfig) return;

    const confirmed = await confirmAlert({
      title: "删除设备",
      message: `确定要删除设备 "${deviceConfig.name}" 及其所有项目配置吗？此操作无法撤销。`,
      primaryAction: {
        title: "删除",
        style: Alert.ActionStyle.Destructive,
      },
      dismissAction: {
        title: "取消",
        style: Alert.ActionStyle.Cancel,
      },
    });

    if (confirmed) {
      const updatedDevices = { ...devices };
      delete updatedDevices[deviceId];
      setDevices(updatedDevices);
      saveConfig(updatedDevices);

      await showToast({
        style: Toast.Style.Success,
        title: "删除成功",
        message: `设备 "${deviceConfig.name}" 已删除`,
      });
    }
  }

  return (
    <List
      isLoading={isLoading}
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
      {Object.entries(devices).map(([deviceId, deviceConfig]) => (
        <List.Item
          key={deviceId}
          icon={Icon.Devices}
          title={deviceConfig.name}
          subtitle={`${deviceConfig.projects.length} 个项目`}
          accessories={
            deviceConfig.name === getCurrentDeviceName()
              ? [
                  {
                    text: "当前设备",
                    icon: Icon.Info,
                  },
                ]
              : []
          }
          actions={
            <ActionPanel>
              <Action title="编辑设备" icon={Icon.Pencil} onAction={() => handleEditDevice(deviceId)} />
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
                onAction={() => handleDeleteDevice(deviceId)}
              />
              <Action.CopyToClipboard title="复制设备名称" content={deviceConfig.name} />
              <Action.CopyToClipboard title="复制设备 Id" content={deviceId} />
            </ActionPanel>
          }
        />
      ))}

      {Object.keys(devices).length === 0 && (
        <List.EmptyView
          icon={Icon.Devices}
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
