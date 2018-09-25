/* global angular */

'use strict';

angular.module('core').filter('nl2br', function(){
    return function(input){
        return input ? input.replace(/\n/g, '<br />') : input;
    };
});
