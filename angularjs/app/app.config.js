/* global angular */

'use strict';

angular.module('App').config(function($locationProvider, $routeProvider){
    $locationProvider.hashPrefix('!');
    $routeProvider
        .when('/repositories/:searchText?', {
            template : '<repo-list></repo-list>'
        })
        .when('/repositories/issues/:authorName/:repoName', {
            template : '<repo-issues></repo-issues>'
        })
        .otherwise('/repositories');
});
