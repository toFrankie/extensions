import React, { useState } from "react";
import { Form, ActionPanel, Action, Icon, useNavigation, showToast, Toast } from "@raycast/api";
import { generateProjectId } from "./utils/config";
import { Project } from "./types";

interface FormData {
  deviceName: string;
  cliPath: string;
  projects: {
    id: string;
    name: string;
    path: string;
  }[];
}

interface DeviceFormProps {
  initialData: FormData;
  onSave: (data: FormData) => Promise<void> | void;
  onCancel: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ initialData, onSave, onCancel }) => {
  const [projects, setProjects] = useState(initialData.projects);
  const [deviceName, setDeviceName] = useState(initialData.deviceName);
  const [cliPath, setCliPath] = useState(initialData.cliPath ? [initialData.cliPath] : []);
  const { pop } = useNavigation();

  function addProject() {
    const newProject = {
      id: generateProjectId(),
      name: "",
      path: "",
    };
    setProjects([...projects, newProject]);
  }

  function removeProject(index: number) {
    const updatedProjects = projects.filter((_, i) => i !== index);
    setProjects(updatedProjects);
    showToast({
      style: Toast.Style.Success,
      title: "项目已删除",
    });
  }

  function updateProject(index: number, field: keyof Project, value: string) {
    const updatedProjects = [...projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setProjects(updatedProjects);
  }

  async function handleSubmit() {
    if (!deviceName.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "设备名称不能为空" });
      return;
    }
    if (cliPath.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "CLI 路径不能为空" });
      return;
    }

    // 过滤掉不完整的项目（名称或路径为空）
    const validProjects = projects.filter((p) => p.name.trim() && p.path.trim());

    await onSave({
      deviceName: deviceName.trim(),
      cliPath: cliPath[0] || "",
      projects: validProjects,
    });
    pop();
  }

  return (
    <Form
      navigationTitle="设备配置"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="保存设备" icon={Icon.Check} onSubmit={handleSubmit} />
          <Action title="添加项目" icon={Icon.Plus} onAction={addProject} shortcut={{ modifiers: ["cmd"], key: "n" }} />
          {projects.map((project, index) => {
            const projectTitle = project.name.trim() || `项目 ${index + 1}`;
            return (
              <Action
                key={`delete-${project.id}`}
                title={`删除"${projectTitle}"`}
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => removeProject(index)}
              />
            );
          })}
          <Action title="取消" icon={Icon.Xmark} onAction={onCancel} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="deviceName"
        title="设备名称"
        placeholder="输入设备名称"
        value={deviceName}
        onChange={setDeviceName}
        info="建议使用 scutil --get ComputerName 获取的设备名称"
      />

      <Form.FilePicker
        id="cliPath"
        title="CLI 路径"
        canChooseFiles={true}
        canChooseDirectories={false}
        allowMultipleSelection={false}
        value={cliPath}
        onChange={setCliPath}
        info="微信开发者工具 CLI 的完整路径"
      />

      <Form.Separator />
      <Form.Description text={`项目配置 (${projects.length} 个项目，添加/删除项目请在 Actions 面板操作)`} />

      {projects.length === 0 ? (
        <Form.Description text="暂无项目，请在下方 Actions 面板中添加项目 (⌘N)" />
      ) : (
        projects.map((project, index) => (
          <React.Fragment key={project.id}>
            <Form.Separator />
            <Form.Description text={`项目 ${index + 1}`} />
            <Form.TextField
              id={`project-${index}-name`}
              title="项目名称"
              placeholder="输入项目名称"
              defaultValue={project.name}
              onChange={(value) => updateProject(index, "name", value)}
            />
            <Form.FilePicker
              id={`project-${index}-path`}
              title="项目路径"
              canChooseFiles={false}
              canChooseDirectories={true}
              allowMultipleSelection={false}
              defaultValue={project.path ? [project.path] : []}
              onChange={(value) => updateProject(index, "path", value?.[0] || "")}
            />
            <Form.Description text={`项目 ID: ${project.id}`} />
          </React.Fragment>
        ))
      )}
    </Form>
  );
};

export default DeviceForm;
