(function () {

    angular
        .module('app')
        .config(['$mdThemingProvider', configure]);

    function configure($mdThemingProvider) {
        // Configure a dark theme with primary foreground yellow
        $mdThemingProvider
            .theme('docs-dark', 'default')
            .primaryPalette('yellow')
            .dark()
            .foregroundPalette['3'] = 'yellow';
    }

})();