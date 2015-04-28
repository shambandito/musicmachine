'use strict';

/**
 * @ngdoc overview
 * @name musicmachineApp
 * @description
 * # musicmachineApp
 *
 * Main module of the application.
 */
angular
  .module('musicmachineApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngMaterial'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
