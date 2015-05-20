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

 	var clock;
 	var context;
 	var analyser;
 	var biquadFilter;
 	var bufferLoader;
	var activeBeats = {};
	$scope.indexes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

	$scope.instruments = [
		'kick',
		'snare',
		'hihatClosed',
		'hihatOpen',
		'tom1',
		'tom2',
		'clap'
	]

 	// buffers to load {name: path}
	var SOUNDBANK = {
	  kick: 'samples/kickdrum1.wav',
	  snare: 'samples/snaredrum1.wav',
	  hihatClosed: 'samples/hihat1.wav',
	  hihatOpen: 'samples/hihat2.wav',
	  tom1: 'samples/tom1.wav',
	  tom2: 'samples/tom2.wav',
	  clap: 'samples/clap1.wav'
	};

	var LOADED_SOUNDBANK = {};

 	$scope.tempo = 120;
	$scope.beatDur = 60 / $scope.tempo / 4;
	$scope.barDur = 16 * $scope.beatDur;

	//wenn tempo vom user updated wird, auch die davon abhängigen variablen updaten
	$scope.$watch('tempo', function() {
		$scope.beatDur = 60 / $scope.tempo / 4;
		$scope.barDur = 16 * $scope.beatDur;
	});

 	$scope.isPlaying = false;

 	$scope.currentBeatIndex = -1;

 	//laden der audio buffers
	$scope.loadBuffers = function() {
		var names = [];
		var paths = [];

		//sample name und pfad in separate arrays speichern
		for (var name in SOUNDBANK) {
			var path = SOUNDBANK[name];
			names.push(name);
			paths.push(path);
		}

		//laden der samples
		bufferLoader = new BufferLoader(context, paths, function(bufferList) {
	  		for (var i = 0; i < bufferList.length; i++) {

				var buffer = bufferList[i];
				var name = names[i];

				//speichern jedes samples mit name als key in der loaded soundbank		    
				LOADED_SOUNDBANK[name] = buffer;
			 }
		});

		bufferLoader.load();
	};

	//click listener auf beats und verwaltung des activeBeats objects
	$scope.beatClickHandler = function() {

		angular.element('.beat').each(function() {

				var beat = angular.element(this);

				//get index, instrument name und audio sample
				var index = beat.attr('beatIndex');
				var rowName = beat.parent().parent().attr('data-sample');
				var track = LOADED_SOUNDBANK[rowName];

				//bei click auf beat:
				beat.click(function() {

					if(!beat.hasClass('active')) {

						//create beat object mit index und audiobuffer
						var beatObj = {'beatIndex': index, 'track': track, 'instrument': rowName};

						//save beatObj in activeBeats
						activeBeats[rowName + index] = beatObj;

						beat.addClass('active');
					}
					else {

						//audio buffer aus activeBeats entfernen 
						//@TODO: "delete" soll nicht sehr performant sein, evtl bessere lösung finden
						delete activeBeats[rowName + index];

						beat.removeClass('active');
					}

					console.log(activeBeats);
				});
		});
	};

	//wird bei jedem neuen beat aufgerufen
	$scope.onNextBeat = function() {

		//index des momentan aktiven beats
		$scope.currentBeatIndex = ($scope.currentBeatIndex + 1) % 16;

		//momentan aktives beat-wrap jQuery object
		var currentTimerButton = angular.element('#timer-row .timer-button:nth-child(' + ($scope.currentBeatIndex + 1) + ')');
		var currentBeat = angular.element('#pattern .beat-wrap:nth-child(' + ($scope.currentBeatIndex + 1) + ') .beat');

		//reset active classes on beats
		angular.element('#timer-row .timer-button').removeClass('active');
		angular.element('#pattern .beat-wrap .beat').removeClass('playing');

		//active beat highlighter
		currentTimerButton.addClass('active');
		currentBeat.addClass('playing');

		//iterate over activeBeats object
		for (var obj in activeBeats) {

		   if (activeBeats.hasOwnProperty(obj)) {

		   	//unser beat object mit index und audiobuffer
		    var beat = activeBeats[obj];

		    //wenn der index des gerade betrachteten beat objects in activeBeats und der aktuelle beat index gleich sind -> sound abspielen
		    if(beat.beatIndex == $scope.currentBeatIndex) {

				$scope.playSound(beat.track, beat.instrument);
			}

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

	//audio buffer abspielen

	$scope.playSound = function(buffer, instrument) {

	  var filterCheck = angular.element('.filterCheckBox');
	  var source = context.createBufferSource();

	  	/*
	  	source.buffer = buffer; 
	  	source.connect(biquadFilter);
	  	biquadFilter.connect(context.destination); */
	  	

	  if(filterCheck.hasClass('md-checked')) {
	  	source.buffer = buffer; 	  	
	  	source.connect(biquadFilter);
	  	biquadFilter.connect(context.destination);
	  	voiceChange();

	  } else {
	  	source.buffer = buffer;
	  	source.connect(context.destination);
	  } 

	  //fallback, falls source.start nicht existiert
	  if (!source.start) {
	    source.start = source.noteOn;
		}

	  //instrument is der name der trackRow, in der der aktuelle Beat liegt
	  console.log(instrument);
	
	  source.start(0);
	};

	//FILTER FUNCTIONS //

	
	function voiceChange() {

			biquadFilter.type = "lowshelf";
    		biquadFilter.frequency.value = 2000;
    		biquadFilter.gain.value = 25;

	}

	//zurücksetzen des grids
	$scope.resetGrid = function() {
		angular.element('.beat').removeClass('active');
		activeBeats = {};
	}

	$scope.startPlaying = function() {

		//wenn clock schon spielt, nicht nochmal den callback starten
		if($scope.isPlaying == false) {
			clock.start();

			console.log($scope.beatDur);
			console.log($scope.tempo);
			clock.callbackAtTime($scope.onNextBeat, $scope.nextBeatTime()).repeat($scope.beatDur).tolerance({late:100});			
		}

		$scope.isPlaying = true;			
	};

	//Nur übergangsweise zum stoppen
	$scope.stopPlaying = function() {	
		$scope.isPlaying = false;
		clock.stop();
	};

	var init = function() {

		//check ob audiocontext verfügbar ist
	 	try {
		    // Fix up prefixing
		    window.AudioContext = window.AudioContext || window.webkitAudioContext;
		    context = new AudioContext();
		    clock = new WAAClock(context, {toleranceEarly: 0.1});
		    
		  

		    biquadFilter = context.createBiquadFilter();



		}
		catch(e) {
			alert("Web Audio API is not supported in this browser");
		}

		//laden unserer audio samples
		$scope.loadBuffers();

		//click handler hinzufügen
		//@TODO: setTimeout ist hier wahrscheinlich eher unschön
		setTimeout($scope.beatClickHandler, 500);		
	}

	//bei document.ready init funktion aufrufen
	angular.element(document).ready(function() {
		init();
	});

 });