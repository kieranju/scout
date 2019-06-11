  'use strict';

  const electron = require('electron');
  const {
      BrowserWindow,
      Menu,
      Tray,
  } = electron;

  const windowManager = require.main.require('./window/window_manager.js');

  module.exports = () => {
      // window properties
      windowManager.searchWindow = new BrowserWindow({
          title: 'Squire',
          width: 600,
          resizable: false,
          fullscreenable: false,
          frame: false,
          hasShadow: false,
          center: true,
          transparent: true,
          skipTaskbar: true,
          alwaysOnTop: true,
      });

      // window view
      windowManager.searchWindow.loadURL(`file://${__dirname}/search.html`);

      // window events
      windowManager.searchWindow.on('closed', () => {
          windowManager.searchWindow = null;
      });
      windowManager.searchWindow.on('minimize', (e) => {
          windowManager.searchWindow.hide();
          e.preventDefault();
      });
      windowManager.searchWindow.on('maximize', (e) => {
          e.preventDefault();
      });
  };
