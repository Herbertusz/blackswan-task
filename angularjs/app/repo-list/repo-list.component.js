/* global angular */

'use strict';

angular.module('App').component('repoList', {
    templateUrl : 'app/repo-list/repo-list.template.html',
    controller : function($http){
        this.orderProp = 'name';
        this.search = function(text){
            if (typeof text === 'undefined' || text.length < 1){
                alert('NEM!');
                return;
            }
            $http.get('app/data/phones.json')
                .then(resp => {
                    this.repositories = resp.data.filter(repo =>
                        repo.name.toLowerCase().indexOf(text.toLowerCase()) > -1
                    );
                }).catch(error => {
                    console.log(error);
                });
        };
    }
});
