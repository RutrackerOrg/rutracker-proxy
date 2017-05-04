/*jshint esversion: 6 */

const electron = require('electron');
const {app, ipcMain} = electron;
const {BrowserWindow, Menu, Tray} = electron;
const os = require('os');
const path = require('path');

const logger = require('winston');
logger.level = 'debug';
global.logger = logger;


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

app.on('window-all-closed', function () {
  app.quit();
});

let tray = null;

app.on('ready', function () {

  mainWindow = new BrowserWindow({
    name: "rto-proxy",
    width: 344,
    height: 244,
    toolbar: false,
    // закоментить для dev
    resizable: false,
    fullscreenable: false,
    center: true,
    icon: appIcon
  });

  mainWindow.loadURL('file://' + __dirname + "/index.html");

  // Uncomment to use Chrome developer tools
  // mainWindow.webContents.openDevTools({detach:true});

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  //noinspection JSUnresolvedFunction
  ipcMain.once('app-initialized', async (event) => {
    console.info('app initialized');

    let proxyIp = null,
      proxyPort = null,
      proxyType = 'http';

    const updateProxy = async (event, requiredType) => {
      console.log([
        'update request',
        requiredType,
      ]);

      proxyType = requiredType;
      [proxyIp, proxyPort] = await getNewProxy(proxyType);

      if (!await checkProxy(proxyType, proxyIp, proxyPort)) {
        await updateProxy(event, requiredType);
      } else {
        event.sender.send('proxy-updated', proxyIp);
      }
    };

    ipcMain.on('proxy-update-request', updateProxy);

    http.createServer().listen(8080, 'localhost').on('request', (req, res) => {
      req.pause();

      const proxyRequest = makeProxyRequest(proxyType, req, res, proxyIp, proxyPort);
      proxyRequest.on('error', e => {
        console.error(e);
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
});
