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
    'ngMaterial',
    'file-model'
  ])
  .config(function ($routeProvider, $mdThemingProvider,$locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
    $mdThemingProvider.theme('default')
    .primaryPalette('indigo')
    .accentPalette('orange');
  });
