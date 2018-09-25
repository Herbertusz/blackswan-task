/* global angular */

'use strict';

/**
 * Repository issue listing component
 */
angular.module('repoIssues').component('repoIssues', {
    templateUrl : 'app/repo-issues/repo-issues.template.html',
    controller : function($http, $routeParams){
        const repo = `${$routeParams.authorName}/${$routeParams.repoName}`;

        $http.get(`https://api.github.com/search/issues?q=repo:${repo}`)
            .then(resp => {
                if (resp.data.total_count > 0){
                    // filter necessary properties into this.issues
                    const displayProperties = [
                        'title', 'html_url', 'body', 'state', 'labels'
                    ];
                    this.issues = resp.data.items.map(
                        issue => displayProperties.reduce(
                            (obj, prop) => ({...obj, [prop] : issue[prop]}), {}
                        )
                    );
                    this.issues = this.issues.filter(issue => issue.state === 'open');
                }
                else {
                    this.issues = [];
                }
            }).catch(error => {
                console.log(error);
            });
    }
});
