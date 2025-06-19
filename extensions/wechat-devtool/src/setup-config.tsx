import { ActionPanel, Action, Form, showToast, Toast, useNavigation, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadConfig, saveConfig, currentDeviceName } from "./utils/config";
import { Project, AllConfig, DeviceConfig } from "./types";

function genProject(name = "", path = ""): Project {
  return { id: crypto.randomUUID(), name, path };
}

/**
 * Visual configuration form for devices and projects.
 */
export default function SetupConfig() {
  const [config, setConfig] = useState<AllConfig>({});
  const [loading, setLoading] = useState(true);
  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [form, setForm] = useState<Record<string, DeviceConfig>>({});
  const { pop } = useNavigation();

  useEffect(() => {
    loadConfig().then((cfg) => {
      setConfig(cfg);
      setDeviceNames(Object.keys(cfg));
      setForm(cfg);
      setLoading(false);
    });
  }, []);

  function handleDeviceChange(name: string, field: keyof DeviceConfig, value: any) {
    setForm((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }));
  }

  function handleProjectChange(device: string, idx: number, field: keyof Project, value: any) {
    setForm((prev) => {
      const projects = prev[device].projects.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
      return { ...prev, [device]: { ...prev[device], projects } };
    });
  }

  function handleAddDevice() {
    const name = `Device ${deviceNames.length + 1}`;
    setDeviceNames((prev) => [...prev, name]);
    setForm((prev) => ({ ...prev, [name]: { cliPath: "", projects: [] } }));
  }

  function handleAddProject(device: string) {
    setForm((prev) => ({
      ...prev,
      [device]: {
        ...prev[device],
        projects: [...prev[device].projects, genProject()],
      },
    }));
  }

  async function handleSubmit() {
    await saveConfig(form);
    showToast({ style: Toast.Style.Success, title: "Configuration Saved" });
    pop();
  }

  if (loading) return null;

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save" icon={Icon.Checkmark} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      {deviceNames.map((dev) => (
        <Form.Description key={dev} title={dev === "__default__" ? "Default Device" : dev} text="" />
      ))}
      <Form.Separator />
      {deviceNames.map((dev) => (
        <>
          <Form.TextField
            key={dev + "-name"}
            id={dev + "-name"}
            title="Device Name"
            placeholder="Enter device name"
            defaultValue={dev === "__default__" ? currentDeviceName() : dev}
            onChange={(v) => {
              if (dev !== "__default__") {
                setDeviceNames((prev) => prev.map((d) => (d === dev ? v : d)));
                setForm((prev) => {
                  const { [dev]: old, ...rest } = prev;
                  return { ...rest, [v]: old };
                });
              }
            }}
          />
          <Form.FilePicker
            key={dev + "-cli"}
            id={dev + "-cliPath"}
            title="CLI Path"
            placeholder="Select the WeChat DevTools CLI executable"
            canChooseFiles
            value={form[dev]?.cliPath ? [form[dev].cliPath] : []}
            onChange={(v) => handleDeviceChange(dev, "cliPath", v[0] || "")}
          />
          <Form.Separator />
          {(form[dev]?.projects || []).map((p, idx) => (
            <>
              <Form.TextField
                key={dev + "-pname-" + idx}
                id={dev + "-pname-" + idx}
                title={`Project Name #${idx + 1}`}
                placeholder="Enter project name"
                defaultValue={p.name}
                onChange={(v) => handleProjectChange(dev, idx, "name", v)}
              />
              <Form.FilePicker
                key={dev + "-ppath-" + idx}
                id={dev + "-ppath-" + idx}
                title="Project Path"
                placeholder="Select the project directory"
                canChooseDirectories
                value={p.path ? [p.path] : []}
                onChange={(v) => handleProjectChange(dev, idx, "path", v[0] || "")}
              />
              <Form.Separator />
            </>
          ))}
          <Form.ActionPanel>
            <Action title="Add Project" icon={Icon.Plus} onAction={() => handleAddProject(dev)} />
          </Form.ActionPanel>
        </>
      ))}
      <Form.ActionPanel>
        <Action title="Add Device" icon={Icon.Plus} onAction={handleAddDevice} />
      </Form.ActionPanel>
    </Form>
  );
}
