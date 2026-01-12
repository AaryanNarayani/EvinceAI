import { nativeTools } from "./native";

export async function loadAllTools() {
  // For now, just native tools
  // Future: Add MCP tools here
  return nativeTools;
}
