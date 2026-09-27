import { BrowserWindow, shell } from 'electron';
import { join } from 'node:path';

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 600,
    show: false,
    backgroundColor: '#08080a',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}
