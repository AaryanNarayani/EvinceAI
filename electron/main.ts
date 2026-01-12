import { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import path from 'node:path'
import { Agent } from '../agent/core/agent'
import { setConfig } from '../agent/core/config'
import { config } from "dotenv";
import { ConversationStore } from '../agent/storage/conversation-store'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
config({ path: path.join(__dirname, '..', '.env') });

console.log('🔑 Environment variables loaded:');
console.log('   OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✓ Set' : '✗ Missing');
console.log('   SERP_API_KEY:', process.env.SERP_API_KEY ? '✓ Set' : '✗ Missing');

process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let tray: Tray | null = null
let blurround: any = null
let agent: Agent | null = null
const conversationStore = new ConversationStore();

try {
  const possiblePaths = [
    path.join(process.env.APP_ROOT!, 'blurround.node'),
    path.join(process.env.APP_ROOT!, 'build', 'Release', 'blurround.node'),
    path.join(__dirname, '..', 'build', 'Release', 'blurround.node'),
  ]
  
  for (const modulePath of possiblePaths) {
    try {
      blurround = require(modulePath)
      console.log(`blurround loaded from: ${modulePath}`)
      break
    } catch (e) {
      // Continue to next path
    }
  }
} catch (err) {
  console.error('⚠️ Failed to load blurround.node:', err)
}

function applyBlurAndRoundCorners(blur : number, radius : number): void {
  if (!win || win.isDestroyed() || process.platform !== 'win32' || !blurround?.setBlur) return
  
  try {
    const handleBuffer = win.getNativeWindowHandle()
    const hwnd = (process.arch === 'x64' || process.arch === 'arm64') 
      ? Number(handleBuffer.readBigInt64LE(0))
      : handleBuffer.readInt32LE(0)
    
    blurround.setBlur(hwnd, blur, radius) // 80 = blur amount, 20 = corner radius
  } catch (err) {
    console.error('❌ Failed to apply blur:', err)
  }
}

applyBlurAndRoundCorners(0, 20)

async function initializeAgent(): Promise<void> {
  try {
    const conversationPath = '/.convo';
    
    setConfig({ conversationPath });
    
    agent = new Agent();
    await agent.initialize();
    console.log('Agent initialized');
    console.log(`Conversations stored at: ${conversationPath}`);
    
    agent.on('text-delta', (delta: string) => {
      win?.webContents.send('agent:text-delta', delta);
    });
    
    agent.on('tool-call-start', ({ toolName }: any) => {
      win?.webContents.send('agent:tool-call-start', toolName);
    });
    
    agent.on('tool-call-complete', ({ toolName }: any) => {
      win?.webContents.send('agent:tool-call-complete', { toolName });
    });
    
    agent.on('error', (error: Error) => {
      win?.webContents.send('agent:error', error.message);
    });
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    throw error;
  }
}

function createWindow(): void {
  win = new BrowserWindow({
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    resizable: true,
    backgroundMaterial: "none",
    // titleBarStyle: 'hidden',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  win.maximize()
  // win.setIgnoreMouseEvents(true, { forward: true })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())

    setTimeout(() => {
      if (win && !win.isDestroyed()) {
        applyBlurAndRoundCorners(0, 20)
        
        const [width, height] = win.getSize()
        win.setSize(width + 1, height + 1)
        win.setSize(width, height)
      }
    }, 200)
  })


  win.on('close', () => {
    // if (!app.isQuitting) {
    //   event.preventDefault()
    //   win?.hide()
    // }
  })

  if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL)
  else win.loadFile(path.join(RENDERER_DIST, 'index.html'))
}

function createTray(): void {
  const iconPath = path.join(process.env.VITE_PUBLIC || '', 'logo', 'logo.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App (Ctrl+K)', click: toggleWindow },
    { label: 'Hide App (Ctrl+K)', click: toggleWindow },
    { type: 'separator' },
    // { label: 'Quit', click: () => { app.isQuitting = true; app.quit() } },
  ])

  tray.setToolTip('Your App Name')
  tray.setContextMenu(contextMenu)
  tray.on('double-click', toggleWindow)
}

function toggleWindow(): void {
  if (!win || win.isDestroyed()) return

  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()

    const [w, h] = win.getSize()
    win.setSize(w + 1, h + 1)
    win.setSize(w, h)
    
    setTimeout(() => applyBlurAndRoundCorners(80, 20), 100)
  }
}

function quitApp(): void {
  // app.isQuitting = true
  app.quit()
}

function registerShortcuts(): void {
  globalShortcut.register('CommandOrControl+K', toggleWindow)
}

ipcMain.on('set-ignore-mouse-events', (_event, ignore: boolean, options?: { forward: boolean }) => {
  if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(ignore, options)
})

ipcMain.handle('set-background', (_event, type: 'glass' | 'acrylic' | 'transparent') => {
  if (!win || win.isDestroyed()) return
  
  if (process.platform === 'darwin') {
    const vibrancyMap:any = { glass: 'window', acrylic: 'sidebar', transparent: null }
    win.setVibrancy(vibrancyMap[type])
  } else {
    const materialMap:any = { glass: 'mica', acrylic: 'acrylic', transparent: 'none' }
    win.setBackgroundMaterial(materialMap[type])
    win.setBackgroundColor('#30000000')
  }

  setTimeout(() => {
    if (win && !win.isDestroyed()) {
      applyBlurAndRoundCorners(80, 20)
      const [w, h] = win.getSize()
      win.setSize(w + 1, h + 1)
      win.setSize(w, h)
    }
  }, 50)
})

ipcMain.handle('set-window-size', async (_event, width: number, height: number) => {
  if (!win || win.isDestroyed()) return
  
  win.setSize(width, height)
  win.center()

  setTimeout(() => {
    if (win && !win.isDestroyed()) {
      applyBlurAndRoundCorners(80, 20)
      const [w, h] = win.getSize()
      win.setSize(w + 1, h + 1)
      win.setSize(w, h)
    }
  }, 100)

  win.webContents.send('window-resized', { width, height })
  setTimeout(() => applyBlurAndRoundCorners(80, 20), 100)
})

ipcMain.handle('toggle-window', async () => toggleWindow())
ipcMain.handle('close-window', async () => quitApp())

ipcMain.handle('agent:chat', async (_event, message: string, conversationId?: string) => {
  try {
    if (!agent) {
      throw new Error('Agent not initialized');
    }
    const response = await agent.chat(message, conversationId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Agent error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('agent:list-conversations', async () => {
  try {
    if (!agent) return [];
    return await agent.listConversations();
  } catch (error) {
    console.error('List conversations error:', error);
    return [];
  }
});

ipcMain.handle('agent:get-conversation', async (_event, id: string) => {
  try {
    
    return await conversationStore.load(id);
  } catch (error) {
    console.error('Get conversation error:', error);
    return {};
  }
});

ipcMain.handle('agent:delete-conversation', async (_event, id: string) => {
  try {
    await conversationStore.delete(id); 
    return { success: true };
  } catch (error) {
    console.error('Delete conversation error:', error);
    return { success: false, error: (error as Error).message };
  }
});

app.on('window-all-closed', (event : any) => event.preventDefault())
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
  else if (win && !win.isDestroyed()) win.show()
})

app.whenReady().then(async () => {
  await initializeAgent();
  createWindow();
  createTray();
  registerShortcuts();
});

app.on('will-quit', () => globalShortcut.unregisterAll())

app.on('before-quit', async () => {
  if (agent) {
    console.log('Cleaning up agent...');
    agent = null;
  }
});