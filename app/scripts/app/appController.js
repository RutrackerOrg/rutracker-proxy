/*jshint esversion: 6 */

(function (angular) {

  angular
    .module('app', ['ngMaterial', 'ngAnimate'])
    .controller('AppController', ['$scope', '$http', AppController])
    .directive('selectOnClick', ['$window', function ($window) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.on('click', function () {
          if ( document.selection ) {
            let range = document.body.createTextRange();
            range.moveToElementText( this  );
            range.select();
          } else if ( window.getSelection ) {
            let range = document.createRange();
            range.selectNodeContents( this );
            window.getSelection().removeAllRanges();
            window.getSelection().addRange( range );
          }
        });
      }
    };
  }]);


  function AppController($scope) {
    const {ipcRenderer, shell} = require('electron');

    $scope.socks = false;
    $scope.loading = true;
    $scope.proxy_ip = 'nope =(';

    $scope.$watch('socks', () => {
      $scope.changeProxy();
    });

    $scope.changeProxy = () => {
      $scope.loading = true;
      ipcRenderer.send('proxy-update-request', ($scope.socks ? 'socks' : 'http'));
    };

    $scope.openHelpUrl = () => {
      // shell.openExternal('http://rutracker.wiki/Rutracker_Proxy');
      ipcRenderer.send('open-help', true);
    };

    ipcRenderer.on('proxy-updated', (event, proxyIp) => {
      $scope.proxy_ip = proxyIp;
      $scope.loading = false;
      $scope.$apply();
    });

    ipcRenderer.send('app-initialized', true);
  }
})(angular); // jshint ignore:line
