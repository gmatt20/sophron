import { app, BrowserWindow } from 'electron';
import { createWindow } from './window';
import { registerIpc } from './ipc';

app.setName('Sophron');

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
