/*jshint esversion: 6 */

const electron = require('electron');
const {app, ipcMain, dialog} = electron;
const {BrowserWindow, Menu, Tray} = electron;
const os = require('os');
const path = require('path');
const {autoUpdater} = require("electron-updater");
const logger = require('winston');
const isDev = require('electron-is-dev');

logger.level = 'debug';
global.logger = logger;

autoUpdater.logger = logger;
autoUpdater.on('update-downloaded', (ev, info) => {});

const checkUpdate = () => {
  try {
    autoUpdater.checkForUpdates();
  } catch (e) {
  }
};

const {request, makeProxyRequest} = require('./lib/request'),
  {getNewProxy, checkProxy} = require('./lib/proxy'),
  url = require('url'),
  http = require('http');

let appIcon = path.normalize(__dirname + '/icons/icon.png');

if (os.platform() === 'win32') {
  appIcon = path.normalize(__dirname + '/icons/icon.ico');
} else if (os.platform() === 'darwin') {
  appIcon = path.normalize(__dirname + '/icons/icon-darwin.png');
}

let mainWindow = null;
let helpWindow = null;

app.on('window-all-closed', function () {
  app.quit();
});

let tray = null;

const runApp = () => {
  mainWindow = new BrowserWindow({
    name: "rto-proxy",
    width: 344,
    height: 244,
    toolbar: false,
    resizable: false,
    fullscreenable: false,
    center: true,
    icon: appIcon,
    show: false,
  });

  mainWindow.loadURL('file://' + __dirname + "/index.html");

  // Uncomment to use Chrome developer tools
  // mainWindow.webContents.openDevTools({detach:true});

  mainWindow.on('closed', function () {
    mainWindow = null;
    helpWindow = null;
    app.quit();
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  //noinspection JSUnresolvedFunction,JSUnusedLocalSymbols
  ipcMain.once('app-initialized', async (event) => {
    logger.info('app initialized');

    let proxyIp = null,
      proxyPort = null,
      proxyType = 'http';

    let change_rate = 0;

    const updateProxy = async (event, requiredType) => {
      logger.log([
        'update request',
        requiredType
      ]);

      if (change_rate >= 10) {
        dialog.showErrorBox('Ошибка', 'Не получилось получить валидный сервер, лимит попыток исчерпан');
        app.quit();
      }

      proxyType = requiredType;
      [proxyIp, proxyPort] = await getNewProxy(proxyType);

      if (!await checkProxy(proxyType, proxyIp, proxyPort)) {
        change_rate++;
        await updateProxy(event, requiredType);
      } else {
        change_rate = 0;
        event.sender.send('proxy-updated', proxyIp);
      }
    };

    ipcMain.on('proxy-update-request', updateProxy);

    ipcMain.on('open-help', () => {
      if (!helpWindow) {
        helpWindow = new BrowserWindow({
          name: "rto-proxy",
          width: 800,
          height: 600,
          toolbar: false,
          // закоментить для dev
          resizable: false,
          fullscreenable: false,
          center: true,
          icon: appIcon,
          show: false
        });
        helpWindow.loadURL('file://' + __dirname + '/help.html');

        // debug only
        // helpWindow.webContents.openDevTools({detach:true});

        mainWindow.on('close', () => {
          helpWindow.close();
        });

        helpWindow.on('ready-to-show', () => {
          helpWindow.show();
        });

        helpWindow.on('closed', () => {
          helpWindow = null;
        });

        helpWindow.on('close', (e) => {
          if (mainWindow) {
            e.preventDefault();
            helpWindow.hide();
          }
        })
      } else if (!helpWindow.isVisible()) {
        helpWindow.show();
      } else {
        helpWindow.focus();
      }
    });

    http.createServer().listen(8080, 'localhost').on('request', (req, res) => {
      req.pause();

      const proxyRequest = makeProxyRequest(proxyType, req, res, proxyIp, proxyPort);
      //noinspection JSUnresolvedFunction
      proxyRequest.on('error', e => {
        logger.error(e);
        res.writeHead(400, {"Content-Type": "text/plain"});
        res.write(e.toString());
        res.end();
      });

      req.pipe(proxyRequest);
      req.resume();
    });
  });

  mainWindow.on('minimize', function (event) {
    if (os.platform() !== 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  const toggleWindow = () => {
    if (!mainWindow.isVisible()) {
      if (os.platform() === 'darwin' && mainWindow.isMinimized()) {
        mainWindow.restore();
      } else {
        mainWindow.show();
      }
    } else {
      mainWindow.hide();
    }
  };

  tray = new Tray(appIcon);
  let contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать/Скрыть',
      click: toggleWindow
    },
    {
      label: 'Выход',
      click: function () {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Rutracker Proxy');
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);
};

app.on('ready', function () {
  if (isDev) {
    runApp();

    // раз в сутки проверяем на обновление и если есть то обновляем
    setTimeout(() => {
      checkUpdate();
    }, 86400);
  } else {
    checkUpdate();
  }
});

