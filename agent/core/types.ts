export interface AgentConfig {
  apiKey: string;
  model: string;
  conversationPath: string;
  allowedPaths: string[];
  dangerousCommandsRequireConfirmation: boolean;
  maxTokens: number;
  serpApiKey: string;
}

export interface AgentResponse {
  text: string;
  conversationId: string;
  toolCalls: ToolCall[];
  metadata: ResponseMetadata;
}

export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: any;
}

export interface ResponseMetadata {
  tokensUsed: number;
  cost: number;
  duration: number;
}

export type AgentEventType =
  | "text-delta"
  | "tool-call-start"
  | "tool-call-complete"
  | "complete"
  | "error";

export interface AgentEvent {
  type: AgentEventType;
  data: any;
  conversationId: string;
  timestamp: string;
}
