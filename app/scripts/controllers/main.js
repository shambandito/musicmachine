'use strict';

/**
 * @ngdoc function
 * @name musicmachineApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the musicmachineApp
 */
 angular.module('musicmachineApp')
 .controller('MainCtrl', function ($scope) {

 	angular.element(document).ready(function() {

 	try {
	    // Fix up prefixing
	    window.AudioContext = window.AudioContext || window.webkitAudioContext;
	    context = new AudioContext();
	    clock = new WAAClock(context, {toleranceEarly: 0.1});
	}
	catch(e) {
		alert("Web Audio API is not supported in this browser");
	}

	$scope.tempo = 60;

	loadBuffers();

	generateGrid();

	clock.start();

	clock.callbackAtTime(uiNextBeat, nextBeatTime(0)).repeat(beatDur).tolerance({late:100});

	setTimeout(beatClickHandler, 500);

	//beatClickHandler();
});




 });
