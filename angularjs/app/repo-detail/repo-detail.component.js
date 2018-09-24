/* global angular */

'use strict';

angular.module('repoDetail').component('repoDetail', {
    templateUrl : 'app/repo-detail/repo-detail.template.html',
    controller : function($http, $routeParams){
        $http.get('app/data/phones.json')
            .then(resp => {
                this.repo = resp.data.filter(repo => repo.id === $routeParams.repoId)[0];
            })
            .catch(error => {
                console.log(error);
            });
        this.repoId = $routeParams.repoId;
    }
});
