import { showToast, Toast } from "@raycast/api";
import { spawnSync } from "child_process";

export function runCli(cliPath: string, args: string[], okMsg: string, errMsg: string) {
  const { status, stdout, stderr } = spawnSync(cliPath, args, { encoding: "utf8" });
  if (status === 0) {
    showToast({ style: Toast.Style.Success, title: okMsg });
  } else {
    showToast({ style: Toast.Style.Failure, title: errMsg, message: stderr || stdout });
  }
}
