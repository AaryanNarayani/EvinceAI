import { EventEmitter } from "events";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { ConversationStore } from "../storage/conversation-store";

import { loadAllTools } from "../tools/registry";
import { systemPrompt } from "../prompts/system";
import { getConfig } from "./config";
import type { AgentResponse, ToolCall, ResponseMetadata } from "./types";

export class Agent extends EventEmitter {
  private openrouter: any;
  private conversationStore: ConversationStore;
  private tools: any;
  private config: ReturnType<typeof getConfig>;

  constructor() {
    super();
    this.config = getConfig();
    
    this.openrouter = createOpenRouter({
      apiKey: this.config.apiKey,
    });
    
    this.conversationStore = new ConversationStore(this.config.conversationPath);
  }

  async initialize(): Promise<void> {
    this.tools = await loadAllTools();
  }

  async chat(
    message: string,
    conversationId?: string
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    
    const conversation = await this.conversationStore.getOrCreate(conversationId);
    
    if (conversation.messages.length === 0) {
      conversation.messages.push({
        role: "system",
        content: systemPrompt,
      });
      conversation.model = this.config.model;
    }

    conversation.messages.push({
      role: "user",
      content: message,
    });

    let fullText = "";
    const toolCalls: ToolCall[] = [];

    try {
      let continueLoop = true;
      
      while (continueLoop) {
        const result = streamText({
          model: this.openrouter(this.config.model),
          messages: conversation.messages,
          tools: this.tools,
        });

        for await (const delta of result.textStream) {
          fullText += delta;
          this.emit("text-delta", delta);
        }

        // Get response and tool calls
        const response = await result.response;
        const currentToolCalls = await result.toolCalls;

        const cleanedMessages = response.messages.map((msg: any) => {
          if (Array.isArray(msg.content)) {
            const cleanedContent = msg.content
              .filter((part: any) => {
                const validTypes = ['text', 'tool-call', 'tool-result', 'image', 'file'];
                return validTypes.includes(part.type);
              })
              .map((part: any) => {
                const { providerOptions, ...cleanPart } = part;
                return cleanPart;
              });
            
            return {
              ...msg,
              content: cleanedContent,
            };
          }
          return msg;
        });

        // cleaned response messages to conversation
        conversation.messages.push(...cleanedMessages);

        if (currentToolCalls && currentToolCalls.length > 0) {
          for (const tc of currentToolCalls as any[]) {
            toolCalls.push({
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              args: tc.args,
            });
            
            this.emit("tool-call-start", {
              toolName: tc.toolName,
              args: tc.args,
            });
          }
          
          for (const tc of currentToolCalls as any[]) {
            this.emit("tool-call-complete", {
              toolName: tc.toolName,
            });
          }
        } else {
          continueLoop = false;
        }
      }

      const duration = Date.now() - startTime;
      conversation.updated = new Date().toISOString();
      
      const uniqueTools = [...new Set(toolCalls.map(tc => tc.toolName))];
      conversation.metadata.toolsUsed = [
        ...new Set([...conversation.metadata.toolsUsed, ...uniqueTools])
      ];

      await this.conversationStore.save(conversation);

      const metadata: ResponseMetadata = {
        tokensUsed: 0, // TODO: Get from response
        cost: 0,       // TODO: Calculate
        duration,
      };

      this.emit("complete", {
        conversationId: conversation.id,
        metadata,
      });

      return {
        text: fullText,
        conversationId: conversation.id,
        toolCalls,
        metadata,
      };
    } catch (error: any) {
      let errorMessage = error.message || "Unknown error occurred";
      
      if (error.message?.includes("No cookie auth credentials")) {
        errorMessage = "Authentication failed: OpenRouter API key is invalid or missing";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = `Network error: ${error.message}. Check your internet connection.`;
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Request timed out. The operation took too long to complete.";
      }
      
      const enhancedError = new Error(errorMessage);
      this.emit("error", enhancedError);
      throw enhancedError;
    }
  }

  async listConversations() {
    return this.conversationStore.list();
  }

  async deleteConversation(id: string) {
    return this.conversationStore.delete(id);
  }
}
