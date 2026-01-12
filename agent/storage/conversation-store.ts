import * as fs from "fs/promises";
import * as path from "path";
import type {
  Conversation,
  ConversationSummary,
  ConversationIndex,
} from "./types";

export class ConversationStore {
  private conversationDir: string;
  private indexPath: string;

  constructor(conversationDir: string = "C:/.convo") {
    this.conversationDir = conversationDir;
    this.indexPath = path.join(conversationDir, "index.json");
  }

  async save(conversation: Conversation): Promise<void> {
    // Ensure .convo directory exists
    await fs.mkdir(this.conversationDir, { recursive: true });

    // Save conversation file
    const conversationPath = this.getConversationPath(conversation.id);
    await fs.writeFile(
      conversationPath,
      JSON.stringify(conversation, null, 2),
      "utf-8"
    );

    // Update index
    await this.updateIndex(conversation);
  }

  async load(id: string): Promise<Conversation> {
    const conversationPath = this.getConversationPath(id);
    
    try {
      const content = await fs.readFile(conversationPath, "utf-8");
      return JSON.parse(content) as Conversation;
    } catch (error) {
      throw new Error(`Conversation ${id} not found`);
    }
  }

  async list(): Promise<ConversationSummary[]> {
    try {
      const content = await fs.readFile(this.indexPath, "utf-8");
      const index: ConversationIndex = JSON.parse(content);
      return index.conversations;
    } catch (error) {
      // If index doesn't exist, return empty array
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const conversationPath = this.getConversationPath(id);
    
    // Delete conversation file
    await fs.unlink(conversationPath);
    
    // Remove from index
    const index = await this.loadIndex();
    index.conversations = index.conversations.filter(c => c.id !== id);
    await this.saveIndex(index);
  }

  async getOrCreate(id?: string): Promise<Conversation> {
    if (id) {
      try {
        return await this.load(id);
      } catch (error) {
        console.log("Creation logic later")
      }
    }

    const timestamp = new Date().toISOString();
    const newId = id || `conv_${timestamp.replace(/[:.]/g, "-")}`;
    
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      created: timestamp,
      updated: timestamp,
      model: "",
      messages: [],
      metadata: {
        toolsUsed: [],
        totalTokens: 0,
        totalCost: 0,
      },
    };

    return newConversation;
  }

  private async updateIndex(conversation: Conversation): Promise<void> {
    const index = await this.loadIndex();
    
    const summary: ConversationSummary = {
      id: conversation.id,
      title: conversation.title,
      created: conversation.created,
      updated: conversation.updated,
      messageCount: conversation.messages.length,
    };

    const existingIndex = index.conversations.findIndex(c => c.id === conversation.id);
    if (existingIndex >= 0) {
      index.conversations[existingIndex] = summary;
    } else {
      index.conversations.push(summary);
    }

    index.conversations.sort((a, b) => 
      new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );

    await this.saveIndex(index);
  }

  private async loadIndex(): Promise<ConversationIndex> {
    try {
      const content = await fs.readFile(this.indexPath, "utf-8");
      return JSON.parse(content) as ConversationIndex;
    } catch (error) {
      return { conversations: [] };
    }
  }

  private async saveIndex(index: ConversationIndex): Promise<void> {
    await fs.mkdir(this.conversationDir, { recursive: true });
    await fs.writeFile(
      this.indexPath,
      JSON.stringify(index, null, 2),
      "utf-8"
    );
  }

  private getConversationPath(id: string): string {
    
    return path.join(this.conversationDir, `${id}.json`);
  }
}
