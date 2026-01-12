export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export const dialogueStream: ChatMessage[] = [];

export function addMessage(role: "user" | "assistant", content: string) {
  dialogueStream.push({
    role,
    content,
    timestamp: Date.now(),
  });
}

export function getMessages() {
  
  return dialogueStream;
}
