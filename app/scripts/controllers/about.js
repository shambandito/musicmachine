'use strict';

/**
 * @ngdoc function
 * @name musicmachineApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the musicmachineApp
 */
angular.module('musicmachineApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
