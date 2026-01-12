export interface AgentResponse {
  success: boolean;
  data?: {
    text: string;
    conversationId: string;
    toolCalls: Array<{
      toolCallId?: string;
      toolName: string;
      args: any;
    }>;
    metadata: {
      tokensUsed: number;
      cost: number;
      duration: number;
    };
  };
  error?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created: string;
  updated: string;
  messageCount: number;
}

export interface AgentAPI {
  chat: (message: string, conversationId?: string) => Promise<AgentResponse>;
  getConversation: (id: string) => Promise<any>;
  listConversations: () => Promise<ConversationSummary[]>;
  deleteConversation: (id: string) => Promise<{ success: boolean; error?: string }>;
  onTextDelta: (callback: (text: string) => void) => () => void;
  onToolCallStart: (callback: (toolName: string) => void) => () => void;
  onToolCallComplete: (callback: (data: { toolName: string }) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
}

declare global {
  interface Window {
    agentAPI: AgentAPI;
    electronAPI: {
      setIgnoreMouseEvents: (ignore: boolean, options: { forward: boolean }) => void;
      setBackground: (type: 'glass' | 'acrylic' | 'transparent') => Promise<void>;
      setWindowSize: (width: number, height: number) => Promise<void>;
      toggleWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;

    };
    ipcRenderer: any;
  }
}

export {};
