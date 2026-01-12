import { configureStore } from '@reduxjs/toolkit'
import Prompts from './PromptSlice'
import Chat from './ChatSilce'


export const store = configureStore({
  reducer: {
    Prompts: Prompts,
    ChatState : Chat, 
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch