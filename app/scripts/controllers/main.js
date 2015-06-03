'use strict';

/**
 * @ngdoc function
 * @name musicmachineApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the musicmachineApp
 */
 angular.module('musicmachineApp')
 .controller('MainCtrl', function ($scope, $http,$mdDialog) {

 	var clock;
	// Für mdDialog
  $scope.showRecordFileDownloadDialog = showRecordFileDownloadDialog;

	$scope.instruments = [];

	$scope.indexes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

	//filter types in the native filter node: lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
	$scope.filters = [
		{id: 'none', name: 'None'},
		{id: 'lowpass', name: 'Low Pass'},
		{id: 'highpass', name: 'High Pass'},
		{id: 'bandpass', name: 'Band Pass'}	
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

	$scope.effects = [
		{id: 'volume', name: 'Volume / Tune'},
		{id: 'filter', name: 'Filter'},
		{id: 'delay', name: 'Delay'}
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

	$scope.addPattern = function() {
		for(var i = 0; i < $scope.instruments.length; i++) {

			$scope.instruments[i].steps.push([false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]);

		}	
	}

	$scope.selectPattern = function(index) {	
		$scope.selectedPattern = index;
	}

	$scope.selectRow = function (i , $event) {
		$scope.selectedRow = i;
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

				var delayTime = $scope.instruments[i].delayTime;
				var delayFeedback = $scope.instruments[i].delayFeedback;
				var delayCutoff = $scope.instruments[i].delayCutoff;

				var filterFreq = (($scope.instruments[i].filterFreq * 22030) / 100) + 20;

				var muted = $scope.instruments[i].muted;

				if(muted) {
					volume = 0;
				}

		    //wenn das "steps" array des aktuellen "instruments" an der stelle des aktiven beatIndex "true" als wert hat -> sample abspielen
		    if(steps[$scope.currentBeatIndex]) {
					sample.playSample(volume, tune, filter, filterFreq, delayTime, delayFeedback, delayCutoff);
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
	};

	//Pausiert den loop und macht da weiter wo man aufgehört hat.
	$scope.pausePlaying = function() {	
		$scope.isPlaying = false;
		clock.stop();
	};

	$scope.record = function(){
		if(!$scope.isRecording){
			console.log($scope.isPlaying);
			if($scope.isPlaying == false){
				console.log("start");
				recorder.record();
				$scope.startPlaying();
				$scope.isRecording = true;
			}else{
				console.log("start without playing");
				recorder.record();
				$scope.isRecording = true;
			}
		}
	};

	$scope.stopRecord = function($event){
		if($scope.isRecording){
			recorder.stop();
			$scope.isRecording = false;
			showRecordFileDownloadDialog($event);
		}
	};

	$scope.resetDelay = function(index) {
		$scope.instruments[index].delayTime = 0;
		$scope.instruments[index].delayFeedback = 0.5;
		$scope.instruments[index].delayCutoff = 10000;
	}
	
	var init = function() {
	 	try {    
		  clock = new WAAClock(context, {toleranceEarly: 0.1});
		}
		catch(e) {
			alert("Web Audio API is not supported in this browser");
		}
		initBinCanvas();
	}
	//Export Pattern
	$scope.exportPattern = function(){
		$scope.data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($scope.instruments));

	}
	// Import Pattern
	$scope.importPattern = function(){

	}

	//Show Dialog
 	function showRecordFileDownloadDialog($event) {
	  var parentEl = angular.element(document.body);
	   	$mdDialog.show({
	     	parent: parentEl,
	     	targetEvent: $event,
	     	template:
	       	'<md-dialog aria-label="List dialog">' +
	       	'  <md-dialog-content id="download">'+
	       	'		 <h2>Download Recorded File</h2>'+
	       	'    <md-input-container><label>Filename</label><input name="filename" ng-model="filename" required md-maxlength="20" minlength="4"></md-input-container>'+
		      '  </md-dialog-content>' +
		      '  <div class="md-actions">' +
		      '    <md-button ng-click="closeDialog()" class="md-primary">' +
		      '      Close Dialog' +
		      '    </md-button>' +
		      '    <md-button ng-click="downloadRecordedFile()" class="md-primary">' +
		      '      Download File' +
		      '    </md-button>' +
		      '  </div>' +
		      '</md-dialog>',
	    	locals: {
	      	filename : $scope.filename
	    	},
	    	controller: DialogController
	  	});
	  	
	  function DialogController(scope, $mdDialog,filename) {
	    scope.closeDialog = function() {
	      $mdDialog.hide();
	    }
	    scope.filename = filename;
	    scope.downloadRecordedFile = function(){
	    	if(scope.filename.length >= 4){
		    	recorder.exportWAV(function(e){
  		    	recorder.clear();
  		    	Recorder.forceDownload(e, scope.filename +".wav");
  		    	scope.closeDialog();
  				});	
	    	}
	    }
	  }
	}
	//bei document.ready init funktion aufrufen
	angular.element(document).ready(function() {
		init();
		initVisualization();
	});
 });