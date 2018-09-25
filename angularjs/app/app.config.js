/* global angular */

'use strict';

/**
 * Rounting (format: domain/#!/repositories/...)
 * @param {Object} $locationProvider
 * @param {Object} $routeProvider
 */
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
