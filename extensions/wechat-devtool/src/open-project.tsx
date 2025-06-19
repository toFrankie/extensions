import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadConfig, getCurrentDeviceConfig } from "./utils/config";
import { runCli } from "./utils/run-cli";
import { Project } from "./types";

/**
 * List and open WeChat Mini Program projects for the current device.
 */
export default function OpenProject() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [cliPath, setCliPath] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig().then((cfg) => {
      const cur = getCurrentDeviceConfig(cfg);
      setProjects(cur.projects);
      setCliPath(cur.cliPath);
      setLoading(false);
    });
  }, []);

  return (
    <List isLoading={loading} searchBarPlaceholder="Search projects by name..." filtering>
      {projects.map((p) => (
        <List.Item
          key={p.id}
          title={p.name}
          subtitle={p.path}
          icon={Icon.Folder}
          actions={
            <ActionPanel>
              <Action
                title="Open in WeChat DevTools"
                icon={Icon.ArrowRight}
                onAction={() =>
                  runCli(cliPath, ["open", "--project", p.path], `Opened ${p.name}`, "Failed to open project")
                }
              />
            </ActionPanel>
          }
        />
      ))}
      {!loading && projects.length === 0 && (
        <List.EmptyView
          title="No Projects Found"
          description="Please add projects in the Setup WeChat Projects command."
        />
      )}
    </List>
  );
}
