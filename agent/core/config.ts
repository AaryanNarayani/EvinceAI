import type { AgentConfig } from "./types";
import { homedir } from "os";

let customConfig: Partial<AgentConfig> | null = null;

function getDefaultConfig(): AgentConfig {
  return {
    apiKey: process.env.OPENROUTER_API_KEY as unknown as string,
    model: "google/gemini-2.5-pro",
    conversationPath: ".convo",
    allowedPaths: [
      process.cwd(),           // Current project directory
      homedir(),               // User's home directory
    ],
    dangerousCommandsRequireConfirmation: true,
    maxTokens: 4000,
    serpApiKey: process.env.SERP_API_KEY as unknown as string,
  };
}

export function setConfig(config: Partial<AgentConfig>): void {
  customConfig = config;
}

export function loadConfig(): AgentConfig {
  return { ...getDefaultConfig(), ...customConfig };
}

export function getConfig(): AgentConfig {
  return loadConfig();
}
