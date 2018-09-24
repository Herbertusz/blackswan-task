/* global angular */

'use strict';

angular.module('App').config(function($locationProvider, $routeProvider){
    $locationProvider.hashPrefix('!');
    $routeProvider
        .when('/repositories', {
            template : '<repo-list></repo-list>'
        })
        .when('/repositories/:repoId', {
            template : '<repo-detail></repo-detail>'
        })
        .otherwise('/repositories');
});
