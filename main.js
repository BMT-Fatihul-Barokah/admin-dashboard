// main.js - Electron main process
const { app, BrowserWindow } = require('electron');
const path = require('path');
const next = require('next');
const express = require('express');
const isDev = !app.isPackaged;

let mainWindow;
let server;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadURL('http://localhost:3000');
}

async function startServerAndApp() {
  const nextApp = next({ dev: isDev, dir: __dirname });
  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();
  const serverInstance = express();
  serverInstance.all('*', (req, res) => handle(req, res));
  server = serverInstance.listen(3000, () => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.whenReady().then(startServerAndApp);

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
