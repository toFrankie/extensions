import React, { useState, useEffect } from "react";
import { List, ActionPanel, Action, showToast, Toast, Icon, useNavigation, confirmAlert, Alert } from "@raycast/api";
import {
  getCurrentDeviceName,
  getAllDeviceConfigs,
  saveConfig,
  isDeviceNameExists,
  generateDeviceId,
} from "./utils/config";
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
    const allDeviceNames = Object.values(devices).map((d) => d.name);
    push(
      <DeviceForm
        allDeviceNames={allDeviceNames}
        initialData={{
          deviceName: "",
          cliPath: "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
          projects: [],
        }}
        onSave={handleSaveDevice}
        onCancel={() => {}}
      />,
    );
  }

  async function handleEditDevice(deviceId: string) {
    const deviceConfig = devices[deviceId];
    if (!deviceConfig) return;
    // 排除自己
    const allDeviceNames = Object.entries(devices)
      .filter(([id]) => id !== deviceId)
      .map(([, d]) => d.name);
    push(
      <DeviceForm
        deviceId={deviceId}
        allDeviceNames={allDeviceNames}
        initialData={{
          deviceName: deviceConfig.name,
          cliPath: deviceConfig.cliPath,
          projects: deviceConfig.projects,
        }}
        onSave={handleSaveDevice}
        onCancel={() => {}}
      />,
    );
  }

  async function handleSaveDevice(data: FormData, deviceId?: string) {
    try {
      // 检查设备名称唯一性
      const isDuplicate = isDeviceNameExists(data.deviceName, deviceId || undefined);
      if (isDuplicate) {
        await showToast({
          style: Toast.Style.Failure,
          title: "设备名称重复",
          message: `设备名称 "${data.deviceName}" 已存在，请使用其他名称`,
        });
        return;
      }

      const deviceConfig: DeviceConfig = {
        name: data.deviceName,
        cliPath: data.cliPath,
        projects: data.projects,
      };

      const updatedDevices = { ...devices };
      if (deviceId) {
        // 编辑时始终用原 UUID 覆盖
        updatedDevices[deviceId] = deviceConfig;
      } else {
        // 新增
        const newDeviceId = generateDeviceId();
        updatedDevices[newDeviceId] = deviceConfig;
      }
      setDevices(updatedDevices);
      saveConfig(updatedDevices);

      await showToast({
        style: Toast.Style.Success,
        title: "保存成功",
        message: `设备 "${data.deviceName}" 配置已保存`,
      });
    } catch (error) {
      console.error("Failed to save device:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "保存失败",
        message: "无法保存设备配置",
      });
    }
  }

  async function handleDeleteDevice(deviceId: string) {
    const deviceConfig = devices[deviceId];
    if (!deviceConfig) return;

    const confirmed = await confirmAlert({
      title: "删除设备",
      message: `确定要删除设备 "${deviceConfig.name}" 及其所有项目配置吗？`,
      primaryAction: {
        title: "删除",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      const updatedDevices = { ...devices };
      delete updatedDevices[deviceId];
      setDevices(updatedDevices);

      // 保存到文件
      saveConfig(updatedDevices);

      await showToast({
        style: Toast.Style.Success,
        title: "删除成功",
        message: `设备 "${deviceConfig.name}" 已删除`,
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
      {Object.entries(devices).map(([deviceId, deviceConfig]) => (
        <List.Item
          key={deviceId}
          icon={Icon.ComputerChip}
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
