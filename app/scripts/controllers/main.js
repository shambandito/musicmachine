'use strict';

/**
 * @ngdoc function
 * @name musicmachineApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the musicmachineApp
 */
 angular.module('musicmachineApp')
 .controller('MainCtrl', function ($scope, $http) {

 	var clock;
 	var analyser;

	$scope.instruments = [];

	$scope.indexes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

	$scope.filters = [
		{id: 'lowpass', name: 'Low Pass'},
		{id: 'highpass', name: 'High Pass'},
		{id: 'bandpass', name: 'Band Pass'},
		{id: 'none', name: 'None'}
	];

 	$scope.isPlaying = false;

 	$scope.currentBeatIndex = -1;

 	$scope.selectedRow = -1;
 	$scope.isRecording = false;

	//drum kits
	$scope.kits = [
		{path: 'TR808', name: 'TR 808'},
		{path: 'TR909', name: 'TR 909'}
	];

	//currently selected kit
	$scope.selectedKit = $scope.kits[0].path;

	//currently selected pattern
	$scope.selectedPattern = 0;

	//timing/tempo variablen
 	$scope.tempo = 120;
	$scope.beatDur = 60 / $scope.tempo / 4;
	$scope.barDur = 16 * $scope.beatDur;

	//wenn tempo vom user updated wird, auch die davon abhängigen variablen updaten
	$scope.$watch('tempo', function() {
		$scope.beatDur = 60 / $scope.tempo / 4;
		$scope.barDur = 16 * $scope.beatDur;
	});

 	//get instruments data
 	//.id, .name, .path, .sample, .steps, .volume, .tune
	$http.get('scripts/instruments.json').success(function(data){
		$scope.instruments = data.drums;
		$scope.loadKit();
	});

	//wenn kit ausgetauscht wird, samples neu laden
	$scope.$watch('selectedKit', function() {
		if(typeof $scope.selectedKit !== "undefined") {
			console.log($scope.selectedKit)
			//$scope.stopPlaying();
			$scope.loadKit();
		}
	});

	$scope.selectRow = function (i , $event) {
		$scope.selectedRow = i;
		console.log($scope.selectedRow);
		angular.element('.instrument-name').removeClass('active-row');
		angular.element($event.target).addClass('active-row');
	}

	//laden eines kits
 	$scope.loadKit = function() {
		for (var i = 0; i < $scope.instruments.length; i++) {
			$scope.instruments[i].sample = new Sample('samples/' + $scope.selectedKit + '/' + $scope.instruments[i].path);
		}; 		
 	}

	//wird bei jedem neuen beat aufgerufen
	$scope.onNextBeat = function() {

		//index des momentan aktiven beats
		$scope.currentBeatIndex = ($scope.currentBeatIndex + 1) % 16;

		//momentan aktive timer und beat jQuery objects
		var currentTimerButton = angular.element('#timer-row .timer-button:nth-child(' + ($scope.currentBeatIndex + 1) + ')');
		var currentBeat = angular.element('#pattern .beat:nth-child(' + ($scope.currentBeatIndex + 1) + ')');

		//reset active classes on beats
		angular.element('#timer-row .timer-button').removeClass('active');
		angular.element('#pattern .beat').removeClass('playing');

		//active beat highlighter
		currentTimerButton.addClass('active');
		currentBeat.addClass('playing');

		//iterate over instruments array
		for (var i = 0; i < $scope.instruments.length; i++) {

				var steps = $scope.instruments[i].steps[$scope.selectedPattern];
				var sample = $scope.instruments[i].sample
				var volume = $scope.instruments[i].volume / 10;
				var tune = $scope.instruments[i].tune;
				var filter = $scope.instruments[i].filter;
				var delay = $scope.instruments[i].delay;

				var filterFreq = (($scope.instruments[i].filterFreq * 15000) / 100);

				var muted = $scope.instruments[i].muted;

				if(muted) {
					volume = 0;
				}

		    //wenn das "steps" array des aktuellen "instruments" an der stelle des aktiven beatIndex "true" als wert hat -> sample abspielen
		    if(steps[$scope.currentBeatIndex]) {
					sample.playSample(volume, tune, filter, filterFreq, delay);
				}
		}
	};

	$scope.nextBeatTime = function() {

	  //vergangene zeit seitdem clock gestartet wurde
	  var currentTime = context.currentTime;

	  //in welchem bar wir gerade sind
	  var currentBar = Math.floor(currentTime / $scope.barDur);

	  return (currentBar + 1) * $scope.barDur;
	};

	//zurücksetzen des grids
	$scope.resetGrid = function() {
		angular.element('.beat').removeClass('active');

		//bei jedem instrument alle steps auf false setzen
		for (var i = 0; i < $scope.instruments.length; i++) {
			for(var j = 0; j < $scope.instruments[i].steps[$scope.selectedPattern].length; j++) {
				$scope.instruments[i].steps[$scope.selectedPattern][j] = false;
			}
		}
	}

	//startet die clock und den loop
	$scope.startPlaying = function() {
		//wenn clock schon spielt, nicht nochmal den callback starten
		if($scope.isPlaying == false) {
			
			clock.start();
			clock.callbackAtTime($scope.onNextBeat, $scope.nextBeatTime()).repeat($scope.beatDur).tolerance({late:100});			
		}
		$scope.isPlaying = true;		
	};

	//Stoppt den loop und fängt von vorne an
	$scope.stopPlaying = function() {	
		$scope.isPlaying = false;
		clock.stop();
		angular.element('#timer-row .timer-button').removeClass('active');
		angular.element('#pattern .beat').removeClass('playing');
		$scope.currentBeatIndex = -1;
		context.currentTime = 0;
	};

	//Pausiert den loop und macht da weiter wo man aufgehört hat.
	$scope.pausePlaying = function() {	
		$scope.isPlaying = false;
		
		clock.stop();
	};

	$scope.record = function(){
		if(!$scope.isRecording){
			recorder.record();
			$scope.isRecording = true;
		}
	};

	$scope.stopRecord = function(){
		if($scope.isRecording){
			recorder.stop();
			$scope.isRecording = false;
			recorder.exportWAV(function(e){
	    	recorder.clear();

	    	Recorder.forceDownload(e, "filename.wav");
	    	
	  	});
		}
	};
	
	var init = function() {
	 	try {    
		  clock = new WAAClock(context, {toleranceEarly: 0.1});
		}
		catch(e) {
			alert("Web Audio API is not supported in this browser");
		}
	};

	//bei document.ready init funktion aufrufen
	angular.element(document).ready(function() {
		init();
	});

 });