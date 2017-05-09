/*jshint esversion: 6 */

(function (angular) {

  angular
    .module('app', ['ngMaterial', 'ngAnimate'])
    .controller('HelpController', ['$scope', HelpController]);


  function HelpController($scope) {
    $scope.client = null;

    $scope.showHelp = (client) => {
      $scope.client = client;
    }
  }
})(angular); // jshint ignore:line
