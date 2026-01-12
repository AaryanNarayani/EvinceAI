import { tool } from "ai";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const DANGEROUS_COMMANDS = [
  "rm -rf",
  "sudo",
  "format",
  "mkfs",
  "dd if=",
  ":(){:|:&};:",  // Fork bomb
  "chmod -R 777",
];

function isDangerousCommand(command: string): boolean {
  return DANGEROUS_COMMANDS.some(dangerous => 
    command.toLowerCase().includes(dangerous.toLowerCase())
  );
}

export const shellTools = {
  executeCommand: tool({
    description: "Execute a shell command and return its output. Use with caution!",
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
    execute: async ({ command }) => {
      console.log(`\n[Tool] Executing command: ${command}`);
      
      if (isDangerousCommand(command)) {
        return `BLOCKED: This command appears to be dangerous and has been blocked for safety. Command: ${command}`;
      }

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 30000,
        });

        if (stderr) {
          return `Command executed with warnings:\n${stdout}\n\nWarnings/Errors:\n${stderr}`;
        }

        return stdout || "Command executed successfully (no output)";
      } catch (error: any) {
        return `Error executing command: ${error.message}`;
      }
    },
  }),

  getCurrentDirectory: tool({
    description: "Get the current working directory path",
    inputSchema: z.object({}),
    execute: async () => {
      console.log(`\n[Tool] Getting current directory`);
      
      try {
        return `Current directory: ${process.cwd()}`;
      } catch (error: any) {
        return `Error getting current directory: ${error.message}`;
      }
    },
  }),
};
