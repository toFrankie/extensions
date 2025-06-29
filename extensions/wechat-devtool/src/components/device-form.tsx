import React, { useState, useEffect } from "react";
import { Form, ActionPanel, Action, Icon, useNavigation, showToast, Toast, confirmAlert, Alert } from "@raycast/api";
import { saveOrUpdateDevice, deleteDevice, getCurrentDeviceName, getAllDeviceConfigs } from "../utils/config";
import { DeviceConfig, Project, WechatProjectConfig } from "../types";
import * as fs from "fs";
import * as path from "path";

interface DeviceFormProps {
  initialData?: Partial<DeviceConfig> & { id?: string };
  onSuccess?: () => void;
}

interface FormErrors {
  deviceName?: string;
  cliPath?: string;
  projects?: { name?: string; path?: string }[];
}

const PROJECT_CONFIG_JSON = "project.config.json";
const PROJECT_PRIVATE_CONFIG_JSON = "project.private.config.json";

function isValidWechatMiniprogramDir(path: string): boolean {
  try {
    const projectConfigPath = `${path}/${PROJECT_CONFIG_JSON}`;
    const projectPrivateConfigPath = `${path}/${PROJECT_PRIVATE_CONFIG_JSON}`;
    return fs.existsSync(projectConfigPath) || fs.existsSync(projectPrivateConfigPath);
  } catch {
    return false;
  }
}

function getProjectName(projectPath: string): string | null {
  try {
    const privateConfigPath = path.join(projectPath, PROJECT_PRIVATE_CONFIG_JSON);
    if (fs.existsSync(privateConfigPath)) {
      const privateConfig: WechatProjectConfig = JSON.parse(fs.readFileSync(privateConfigPath, "utf8"));
      if (privateConfig.projectname) {
        return decodeURIComponent(privateConfig.projectname);
      }
    }

    const configPath = path.join(projectPath, PROJECT_CONFIG_JSON);
    if (fs.existsSync(configPath)) {
      const config: WechatProjectConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.projectname) {
        return decodeURIComponent(config.projectname);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default function DeviceForm({ initialData, onSuccess }: DeviceFormProps) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const [deviceName, setDeviceName] = useState(() => {
    if (initialData?.name !== undefined) {
      return initialData.name;
    }

    if (!initialData?.id) {
      const currentDeviceName = getCurrentDeviceName();
      const allDevices = getAllDeviceConfigs();
      const deviceNames = Object.values(allDevices).map((d) => d.name);

      if (deviceNames.length === 0 || !deviceNames.includes(currentDeviceName)) {
        return currentDeviceName;
      }
    }

    return "";
  });

  const [cliPath, setCliPath] = useState(initialData?.cliPath || "");
  const [projects, setProjects] = useState<Project[]>(initialData?.projects || []);
  const [errors, setErrors] = useState<FormErrors>({});
  const [errorVisible, setErrorVisible] = useState(false);

  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!isEdit && projects.length === 0) {
      addProject();
    }
  }, []);

  function showErrors(newErrors: FormErrors) {
    setErrors(newErrors);
    setErrorVisible(true);

    setTimeout(() => {
      setErrorVisible(false);
    }, 3000);
  }

  function clearError(errorKey: string) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (errorKey.startsWith("project_")) {
        const [, index, field] = errorKey.split("_");
        const projectIndex = parseInt(index);
        if (newErrors.projects && newErrors.projects[projectIndex]) {
          newErrors.projects[projectIndex] = { ...newErrors.projects[projectIndex], [field]: undefined };
        }
      } else {
        (newErrors as Record<string, string | undefined>)[errorKey] = undefined;
      }
      return newErrors;
    });
  }

  function handleDeviceNameChange(value: string) {
    setDeviceName(value);
    clearError("deviceName");
  }

  function handleCliPathChange(files: string[]) {
    setCliPath(files[0] || "");
    clearError("cliPath");
  }

  function handleProjectNameChange(index: number, value: string) {
    updateProject(index, { ...projects[index], name: value });
    clearError(`project_${index}_name`);
  }

  function handleProjectPathChange(index: number, files: string[]) {
    const selectedPath = files[0] || "";
    const project = projects[index];
    updateProject(index, { ...project, path: selectedPath });
    clearError(`project_${index}_path`);

    if (selectedPath) {
      if (!isValidWechatMiniprogramDir(selectedPath)) {
        const hadValidPath = project.path && isValidWechatMiniprogramDir(project.path);

        if (!hadValidPath) {
          showErrors({
            [`project_${index}_path`]:
              "所选路径不是有效的微信小程序项目（缺少 project.config.json 或 project.private.config.json）",
          });
          updateProject(index, { ...project, path: "" });
        } else {
          showToast({
            style: Toast.Style.Failure,
            title: "路径无效",
            message: "所选路径不是有效的微信小程序项目，保持原路径",
          });
          updateProject(index, { ...project, path: project.path });
        }
      } else {
        if (!project.name.trim()) {
          const projectName = getProjectName(selectedPath);
          if (projectName) {
            updateProject(index, { ...project, path: selectedPath, name: projectName });
          }
        }
      }
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    let hasErrors = false;

    if (!deviceName.trim()) {
      newErrors.deviceName = "必填项";
      hasErrors = true;
    }
    if (!cliPath.trim()) {
      newErrors.cliPath = "必填项";
      hasErrors = true;
    }

    const projectErrors: { name?: string; path?: string }[] = [];
    projects.forEach((p, i) => {
      const projectError: { name?: string; path?: string } = {};
      if (!p.name.trim()) {
        projectError.name = "必填项";
        hasErrors = true;
      }
      if (!p.path.trim()) {
        projectError.path = "必填项";
        hasErrors = true;
      }
      if (projectError.name || projectError.path) {
        projectErrors[i] = projectError;
      }
    });

    if (projectErrors.length > 0) {
      newErrors.projects = projectErrors;
    }

    if (hasErrors) {
      showErrors(newErrors);
    }

    return !hasErrors;
  }

  async function handleSubmit() {
    if (!validate()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "请完善所有必填项",
      });
      return;
    }
    setIsLoading(true);
    try {
      const deviceConfig: DeviceConfig = {
        name: deviceName.trim(),
        cliPath: cliPath.trim(),
        projects: projects.map((p) => ({ ...p, name: p.name.trim(), path: p.path.trim() })),
      };
      const result = await saveOrUpdateDevice(deviceConfig, initialData?.id);
      if (result.success) {
        onSuccess?.();
        pop();
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "保存失败",
        message: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;
    setIsLoading(true);
    try {
      const confirmed = await confirmAlert({
        title: "确认删除设备配置",
        message: `确定要删除设备 "${deviceName}" 及其所有项目配置吗？此操作无法撤销。`,
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
        deleteDevice(initialData.id);
        await showToast({
          style: Toast.Style.Success,
          title: "设备配置已删除",
        });
        onSuccess?.();
        pop();
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "删除失败",
        message: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function addProject() {
    const newProject: Project = {
      id: `project_${Date.now()}`,
      name: "",
      path: "",
    };
    setProjects([...projects, newProject]);
  }

  function updateProject(index: number, project: Project) {
    const newProjects = [...projects];
    newProjects[index] = project;
    setProjects(newProjects);
  }

  function removeProject(index: number) {
    if (projects.length <= 1) {
      showToast({
        style: Toast.Style.Failure,
        title: "至少需要保留一个项目",
      });
      return;
    }
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={isEdit ? "编辑设备配置" : "新增设备配置"}
      actions={
        <ActionPanel>
          <Action
            title={isEdit ? "更新配置" : "保存配置"}
            icon={Icon.Check}
            onAction={handleSubmit}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
          />
          <Action
            title="添加项目"
            icon={Icon.Plus}
            onAction={() => addProject()}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
          <Action title="取消" icon={Icon.Xmark} onAction={pop} />
          {isEdit && (
            <Action title="删除设备" icon={Icon.Trash} style={Action.Style.Destructive} onAction={handleDelete} />
          )}
          {projects.map((project, index) => (
            <Action
              key={`remove_${project.id}`}
              title={`移除项目 ${index + 1}`}
              icon={Icon.Minus}
              style={Action.Style.Destructive}
              onAction={() => removeProject(index)}
            />
          ))}
        </ActionPanel>
      }
    >
      <Form.TextField
        id="deviceName"
        title="设备名称"
        placeholder="建议与系统设备名一致"
        value={deviceName}
        onChange={handleDeviceNameChange}
        error={errorVisible ? errors.deviceName : undefined}
        info="应设置与 'scutil --get ComputerName' 一致的设备名称"
      />
      <Form.FilePicker
        id="cliPath"
        title="微信开发者工具 CLI 路径"
        value={cliPath ? [cliPath] : []}
        onChange={handleCliPathChange}
        canChooseFiles
        canChooseDirectories={false}
        allowMultipleSelection={false}
        info="选择微信开发者工具安装目录下的 cli 可执行文件，通常在 /Applications/wechatwebdevtools.app/Contents/MacOS/cli。"
        error={errorVisible ? errors.cliPath : undefined}
      />
      <Form.Separator />
      <Form.Description text="可通过 Actions 面板添加或移除项目。" />
      <Form.Separator />
      {projects.map((project, index) => {
        const projectError = errors.projects && errors.projects[index] ? errors.projects[index] : {};
        const isLastProject = index === projects.length - 1;

        return (
          <React.Fragment key={project.id}>
            <Form.Description text={`项目 ${index + 1}`} />
            <Form.TextField
              id={`project_${index}_name`}
              title="项目名称"
              placeholder="输入项目名称"
              value={project.name}
              onChange={(value) => handleProjectNameChange(index, value)}
              error={errorVisible ? projectError.name : undefined}
            />
            <Form.FilePicker
              id={`project_${index}_path`}
              title="项目路径"
              value={project.path ? [project.path] : []}
              onChange={(files) => handleProjectPathChange(index, files)}
              canChooseFiles={false}
              canChooseDirectories
              allowMultipleSelection={false}
              info="请选择微信小程序项目的根目录（包含 project.config.json 文件）"
              error={errorVisible ? projectError.path : undefined}
            />
            {!isLastProject && <Form.Separator />}
          </React.Fragment>
        );
      })}
    </Form>
  );
}
