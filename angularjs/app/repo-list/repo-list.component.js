/* global angular */

'use strict';

angular.module('App').component('repoList', {
    templateUrl : 'app/repo-list/repo-list.template.html',
    controller : function($http, $routeParams, $location){
        this.orderProp = 'name';
        this.search = function(searchText, keyEvent = null){
            const condition = (
                (!keyEvent || (keyEvent && keyEvent.key === 'Enter')) &&
                typeof searchText !== 'undefined' && searchText.length > 0
            );
            if (condition){
                $http.get(`https://api.github.com/search/repositories?q=${searchText}`)
                    .then(resp => {
                        if (resp.data.total_count > 0){
                            const displayProperties = [
                                'id', 'name', 'full_name', 'html_url', 'stargazers_count',
                                'forks_count', 'open_issues_count'
                            ];
                            this.repositories = resp.data.items.map(
                                repo => displayProperties.reduce(
                                    (obj, prop) => ({...obj, [prop] : repo[prop]}), {}
                                )
                            );
                        }
                        else {
                            this.repositories = [];
                        }
                        $location.update_path(`/repositories/${searchText}`);
                    }).catch(error => {
                        console.log(error);
                    });
            }
        };
        if (typeof $routeParams.searchText !== 'undefined'){
            this.search($routeParams.searchText);
        }
    }
});
