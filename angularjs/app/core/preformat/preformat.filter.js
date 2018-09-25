/* global angular */

'use strict';

/**
 * Raw HTML formatting (\n -> <br />; '    ' -> non-breaking space)
 */
angular.module('core').filter('preformat', function(){
    return function(input){
        return input ?
            input.replace(/\n/g, '<br />').replace(/    /g, '&nbsp;&nbsp;&nbsp;&nbsp;') :
            input;
    };
});
