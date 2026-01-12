import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatState {
  activeId: string | null;
  activeContent: ChatMessage[];
}

const initialState: ChatState = {
  activeId: null,
  activeContent: [],
};

const ChatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveId(state, action: PayloadAction<string | null>) {
      state.activeId = action.payload;
    },
    setActiveContent(state, action: PayloadAction<ChatMessage[]>) {
      state.activeContent = action.payload;
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.activeContent.push(action.payload);
    },
    updateLastMessage(state, action: PayloadAction<string>) {
      // Append text to the last assistant message
      const lastMessage = state.activeContent[state.activeContent.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        lastMessage.content += action.payload;
      }
    },
    clearMessages(state) {
      state.activeContent = [];
    },
  },
});

export default ChatSlice.reducer;

export const setActiveId = ChatSlice.actions.setActiveId;
export const setActiveContent = ChatSlice.actions.setActiveContent;
export const addMessage = ChatSlice.actions.addMessage;
export const updateLastMessage = ChatSlice.actions.updateLastMessage;
export const clearMessages = ChatSlice.actions.clearMessages;