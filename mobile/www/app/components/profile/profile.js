(function() {
    'use strict';

    angular.module('tatami')
        .config(config);

    function config($stateProvider) {

            $stateProvider
                .state('profile', {
                    url: '/profile/:userId',
                    templateUrl: 'app/components/profile/profile.html',
                    controller: 'ProfileCtrl',
                    controllerAs: 'vm',
                    views: {

                    },
                    resolve: {
                        user: getUser
                    }
                });
    }

    getUser.$inject = ['UserService', '$stateParams'];
    function getUser(UserService, $stateParams) {
        return UserService.get({ username : $stateParams.userId }).$promise;
    }

})();