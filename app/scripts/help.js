const electron = require('electron');
const {ipcRenderer} = electron;
const {remote} = electron;

function boot() {

  // Get logger instance and inject it in Angular
  const logger = remote.getGlobal('logger');
  angular
    .module('app')
    .value('logger', logger);

  angular.bootstrap(document, ['app'], {
    strictDi: true
  });
}

document.addEventListener('DOMContentLoaded', boot);
