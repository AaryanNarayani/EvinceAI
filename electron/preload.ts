import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore: boolean, options: { forward: boolean }) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options)
  },
  setBackground: (type : 'glass' | 'acrylic' | 'transparent') => ipcRenderer.invoke('set-background', type),
  setWindowSize: (width: number, height: number) => ipcRenderer.invoke('set-window-size', width, height),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
})

contextBridge.exposeInMainWorld('agentAPI', {
  chat: (message: string, conversationId?: string) => 
    ipcRenderer.invoke('agent:chat', message, conversationId),
  
  listConversations: () => 
    ipcRenderer.invoke('agent:list-conversations'),

  getConversation: (id : string) => 
    ipcRenderer.invoke('agent:get-conversation', id ),

  deleteConversation: (id : string) => 
    ipcRenderer.invoke('agent:delete-conversation', id ),
  
  onTextDelta: (callback: (text: string) => void) => {
    const handler = (_: any, text: string) => callback(text);
    ipcRenderer.on('agent:text-delta', handler);
    return () => ipcRenderer.removeListener('agent:text-delta', handler);
  },
  
  onToolCallStart: (callback: (toolName: string) => void) => {
    const handler = (_: any, toolName: string) => callback(toolName);
    ipcRenderer.on('agent:tool-call-start', handler);
    return () => ipcRenderer.removeListener('agent:tool-call-start', handler);
  },
  
  onToolCallComplete: (callback: (data: { toolName: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('agent:tool-call-complete', handler);
    return () => ipcRenderer.removeListener('agent:tool-call-complete', handler);
  },
  
  onError: (callback: (error: string) => void) => {
    const handler = (_: any, error: string) => callback(error);
    ipcRenderer.on('agent:error', handler);
    return () => ipcRenderer.removeListener('agent:error', handler);
  },
})


