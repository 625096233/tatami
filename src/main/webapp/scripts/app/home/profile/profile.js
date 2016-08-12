(function() {
'use strict';

    angular.module('tatamiJHipsterApp')
        .config(profileConfig);

    profileConfig.$inject = ['$stateProvider'];
    function profileConfig($stateProvider) {
        $stateProvider
        //state for all views that use profile sidebar
        .state('otherUserProfile', {
            parent: 'sidebarHome',
            url: '/profile/:username',
            abstract: true,
            resolve: {
                user: ['UserService', '$stateParams', function (UserService, $stateParams) {
                    console.log($stateParams.username);
                    return UserService.get({username: $stateParams.username}).$promise;
                }],
                tags: ['TagService', '$stateParams', function (TagService, $stateParams) {
                    return TagService.query({popular: true, username: $stateParams.username}).$promise;
                }]
            }
        })
    }
})();




