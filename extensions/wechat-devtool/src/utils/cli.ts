import { exec } from "child_process";
import { promisify } from "util";
import { showToast, Toast } from "@raycast/api";

const execAsync = promisify(exec);

export interface CliResult {
  success: boolean;
  message: string;
  error?: string;
  stdout?: string;
  stderr?: string;
  code?: number;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

interface ExecError extends Error {
  code?: number | string;
  stderr?: string;
}

export async function executeCliCommand(cliPath: string, args: string[]): Promise<CliResult> {
  try {
    const command = `"${cliPath}" ${args.join(" ")}`;
    console.log(`Executing: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
    });

    if (stderr) {
      console.warn("CLI stderr:", stderr);
    }

    return {
      success: true,
      message: stdout.trim() || "Command executed successfully",
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error: unknown) {
    console.error("CLI execution failed:", error);

    const execError = error as ExecError;
    let errorMessage = "Unknown error occurred";
    if (execError.code === -1) {
      errorMessage = "CLI returned error code -1";
    } else if (execError.code === "ENOENT") {
      errorMessage = "CLI executable not found";
    } else if (execError.code === "ETIMEDOUT") {
      errorMessage = "Command execution timed out";
    } else if (execError.stderr) {
      errorMessage = execError.stderr.trim();
    } else if (execError.message) {
      errorMessage = execError.message;
    }

    return {
      success: false,
      message: "Command execution failed",
      error: errorMessage,
      stderr: execError.stderr,
      code: typeof execError.code === "number" ? execError.code : undefined,
    };
  }
}

export async function openProject(cliPath: string, projectPath: string): Promise<OperationResult> {
  try {
    const command = `"${cliPath}" open --project "${projectPath}"`;
    const { stderr } = await execAsync(command);
    if (stderr && stderr.trim()) {
      console.warn("CLI stderr:", stderr);
    }
    await showToast({
      style: Toast.Style.Success,
      title: "✅ 成功",
      message: `已打开项目: ${projectPath}`,
    });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to open project:", errorMessage);
    await showToast({
      style: Toast.Style.Failure,
      title: "❌ 失败",
      message: errorMessage,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
}
