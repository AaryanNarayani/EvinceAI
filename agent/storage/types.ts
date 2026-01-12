import type { ModelMessage } from "ai";

export interface Conversation {
  id: string;
  title: string;
  created: string;
  updated: string;
  model: string;
  messages: ModelMessage[];
  metadata: ConversationMetadata;
}

export interface ConversationMetadata {
  toolsUsed: string[];
  totalTokens: number;
  totalCost: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created: string;
  updated: string;
  messageCount: number;
}

export interface ConversationIndex {
  conversations: ConversationSummary[];
}
