(function() {
    'use strict';

    angular.module('tatami', [
        'ionic',
        'tatami.services',
        'tatami.providers',
        'ngResource',
        'ngCordova',
        'hc.marked',
        'pascalprecht.translate',
        'ionic-toast'
    ]);

    angular.module('tatami')
        .run(tatamiRun)
        .config(tatamiConfig);

    tatamiRun.$inject = ['$ionicPlatform', '$state', '$localStorage', '$ionicHistory', '$translate', 'PathService', 'TatamiEndpoint', '$http'];
    function tatamiRun($ionicPlatform, $state, $localStorage, $ionicHistory, $translate, PathService, TatamiEndpoint, $http) {

        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)

            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                if ($ionicPlatform.is('android')) {
                    StatusBar.backgroundColorByHexString('#444444');
                } else {
                    StatusBar.backgroundColorByName('white');
                }
            }

            // first, the endpoint (when TatamiEndpoint is injected) gets set up or reset
            // based on whether or not it's been set before
            // then, we check is the (new) default endpoint live?
            $http({
                url: '/tatami/rest/client/id',
                method: 'GET'
            }).then(function(result) {
                // if the endpoint is live...
                if (isValidToken()) {
                    // ...and the token is valid, go to the timeline
                    $state.go('timeline');
                } else {
                    // ...and the token is invalid, trash it and log the user out
                    $localStorage.signOut();
                    logout();
                }
            }, function(result) {
                // if the endpoint is invalid/down, the token is worthless now, so trash it,
                // log out, and reset endpoint to default
                $localStorage.signOut();
                TatamiEndpoint.reset();
                logout();
            });
        });

        $ionicPlatform.on('resume', function resume() {
            if (!isValidToken()) {
                $localStorage.signOut();
                logout();
            }
        });

        function logout() {
            $localStorage.signOut();
            $ionicHistory.clearCache();
            $state.go('login');
        }

        function isValidToken() {
            var token = $localStorage.get('token');
            return token && token.expires && token.expires > new Date().getTime()
        }

        var absolutePathChecker = new RegExp('^(?:[a-z]+:)?//', 'i');
        document.onclick = function (e) {
            e = e ||  window.event;
            var element = e.target || e.srcElement;

            if (element.tagName == 'A' && absolutePathChecker.test(element.href)) {
                window.open(element.href, "_blank", "location=yes,presentationstyle=pagesheet,EnableViewPortScale=yes");
                return false;
            }
        };
    }

    tatamiConfig.$inject = [
        '$resourceProvider',
        '$stateProvider',
        '$translateProvider',
        '$compileProvider',
        '$httpProvider'
    ];
    function tatamiConfig($resourceProvider, $stateProvider, $translateProvider, $compileProvider, $httpProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
        $resourceProvider.defaults.stripTrailingSlashes = false;

        $stateProvider
        // setup an abstract state for the tabs directive
            .state('tatami', {
                url: '',
                abstract: true,
                templateUrl: 'app/tatami.html',
                controller: 'TatamiCtrl',
                controllerAs: 'vm',
                resolve: {
                    translatePartialLoader: getTranslationPartialLoader
                }
            });

        getTranslationPartialLoader.$inject = ['$translate', '$translatePartialLoader'];
        function getTranslationPartialLoader($translate, $translatePartialLoader) {
            $translatePartialLoader.addPart('user');
            $translatePartialLoader.addPart('status');
            $translatePartialLoader.addPart('conversation');
            return $translate.refresh();
        }

        $httpProvider.interceptors.push('authInterceptor');
        $httpProvider.interceptors.push('authExpiredInterceptor');
        $httpProvider.interceptors.push('endpointInterceptor');

        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: 'i18n/{lang}/{part}.json'
        });

        var usedLanguage = window.localStorage.getItem('language') || navigator.language.split('-')[0] || 'en';
        window.localStorage.setItem('language', usedLanguage);

        $translateProvider.preferredLanguage(usedLanguage);
        $translateProvider.use(usedLanguage);
        $translateProvider.useSanitizeValueStrategy('escaped');
        $translateProvider.addInterpolation('$translateMessageFormatInterpolation');

        $compileProvider.directive('compile', compile);

        compile.$inject = ['$compile'];
        function compile($compile) {
            return directive;

            directive.$inject = ['scope', 'element', 'attrs'];
            function directive(scope, element, attrs) {
                var ensureCompileRunsOnce = scope.$watch(
                    function(scope) {
                        return scope.$eval(attrs.compile);
                    },
                    function(value) {
                        element.html(value);

                        $compile(element.contents())(scope);

                        ensureCompileRunsOnce();
                    }
                );
            }
        }
    }
})();
