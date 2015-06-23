'use strict';

/**
 * @ngdoc function
 * @name musicmachineApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the musicmachineApp
 */
 angular.module('musicmachineApp')
 .controller('MainCtrl', function ($scope, $http, $mdDialog) {

 	var clock;

 	$scope.defaultsettings;
	$scope.instruments = [];
	$scope.wasloaded = false;
	$scope.indexes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

	$scope.tabIndex = 0;
	$scope.selectedRow = -1;
 	$scope.currentBeatIndex = -1;

	var masterVolume = 1;
	$scope.masterVolume = 10;

	$scope.muteDisabled = false;

 	$scope.isPlaying = false;
 	$scope.isRecording = false;

 	$scope.showAnalyser = false;


	//filter types in the native filter node: lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
	$scope.filters = [
		{id: 'none', name: 'None'},
		{id: 'lowpass', name: 'Low Pass'},
		{id: 'highpass', name: 'High Pass'},
		{id: 'bandpass', name: 'Band Pass'}	
	]; 	

	//drum kits
	$scope.kits = [
		{path: 'TR808', name: 'TR 808'},
		{path: 'TR909', name: 'TR 909'},
		{path: 'house', name: 'House'},
		{path: 'acoustic', name: 'Acoustic'},
		{path: 'linn', name: 'Linn Drum'},
		{path: 'nature', name: 'Nature'},
		{path: 'korg', name: 'Korg Volca'},
		{path: 'reggae', name: 'Reggae'}
	];

	//effects
	$scope.effects = [
		{id: 'volume', name: 'Volume / Pitch'},
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
	$scope.updateTempo = function(tempo) {
		$scope.tempo = tempo;
		$scope.beatDur = 60 / $scope.tempo / 4;
		$scope.barDur = 16 * $scope.beatDur;
	};

	//wenn masterVolume vom user updated wird, variablen updaten
	$scope.updateMasterVolume = function(vol) {
		$scope.masterVolume = vol;
		masterVolume = $scope.masterVolume / 10;
	};
	
	if(localStorage.getItem("session") == null || typeof localStorage.getItem("session") == "undefined" || localStorage.getItem("session") == "undefined" ){
 		if($scope.wasloaded == false){
	 		$http.get('scripts/instruments.json').success(function(data){
	 			$scope.instruments = data.drums;
	 			$scope.defaultsettings = true;
	 			$scope.loadKit();
	 			$scope.wasloaded = true;
	 		});
	 	}
 	}else{	
 		/*if($scope.wasloaded == false){
	 		$http.get('scripts/instruments.json').success(function(data){
	 			$scope.instruments = data.drums;
	 			defaultsettings = JSON.stringify($scope.instruments);
	 			$scope.loadKit();
	 			$scope.wasloaded = true;
	 		});

	 	}*/
 		showSessionWindow();
 	}
 	//get instruments data
 	//.id, .name, .path, .sample, .steps, .volume, .pitch
 	/*if($scope.wasloaded === false) {
 		$http.get('scripts/instruments.json').success(function(data){
 			$scope.instruments = data.drums;
 			$scope.loadKit();
 			$scope.wasloaded = true;
 		});
 	}
*/
	//wenn kit ausgetauscht wird, samples neu laden
	$scope.updateKit = function(kit) {
		$scope.selectedKit = kit;
		if(typeof $scope.selectedKit !== 'undefined') {
			//$scope.stopPlaying();
			$scope.loadKit();
		};	
	}
	$scope.setdefaulttofalse = function() {
		$scope.defaultsettings = false; 
	}

	$scope.addPattern = function() {
		for(var i = 0; i < $scope.instruments.length; i++) {
			$scope.instruments[i].steps.push([false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]);
		};
	};

	$scope.selectPattern = function(index) {	
		$scope.selectedPattern = index;
	};

	//select an instrument row and move to instrument effects tab
	$scope.selectRow = function (i , $event) {
		$scope.selectedRow = i;
		$scope.tabIndex = 1;
	};

	//laden eines kits
 	$scope.loadKit = function() {
 		$scope.stopPlaying();
		for (var i = 0; i < $scope.instruments.length; i++) {
			$scope.instruments[i].sample = new Sample('samples/' + $scope.selectedKit + '/' + $scope.instruments[i].path);
		}; 		
 	};

	//wird bei jedem neuen beat aufgerufen
	$scope.onNextBeat = function() {

		//index des momentan aktiven beats
		$scope.currentBeatIndex = ($scope.currentBeatIndex + 1) % 16;

		//momentan aktive timer und beat jQuery objects
		var currentTimerButton = angular.element('#timer-row .timer-button.timer-' + ($scope.currentBeatIndex));
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

			if(steps[$scope.currentBeatIndex]) {
				var sample = $scope.instruments[i].sample;

				var volume = ($scope.instruments[i].volume / 10) * masterVolume;
				var pitch = $scope.instruments[i].pitch;
				var filter = $scope.instruments[i].filter;

				var delayTime = $scope.instruments[i].delayTime;
				var delayFeedback = $scope.instruments[i].delayFeedback;
				var delayCutoff = $scope.instruments[i].delayCutoff;

				//		NewValue = (((OldValue - OldMin) * (NewMax - NewMin)) / (OldMax - OldMin)) + NewMin

				var filterFreq;

				if($scope.instruments[i].filterFreq <= 20) {
					filterFreq = ((($scope.instruments[i].filterFreq - 1) * (500 - 20)) / (20 - 1)) + 20;
				} else if(20 < $scope.instruments[i].filterFreq <= 40) {
					filterFreq = ((($scope.instruments[i].filterFreq - 21) * (2500 - 500)) / (40 - 21)) + 500;
				} else if(40 < $scope.instruments[i].filterFreq <= 60) {
					filterFreq = ((($scope.instruments[i].filterFreq - 41) * (10000 - 2500)) / (60 - 41)) + 2500;
				} else if(80 < $scope.instruments[i].filterFreq <= 100) {
					filterFreq = ((($scope.instruments[i].filterFreq - 81) * (20000 - 10000)) / (100 - 81)) + 10000;
				}

				var muted = $scope.instruments[i].muted;
				var solo = $scope.instruments[i].solo;

				var pannerRate = $scope.instruments[i].pannerRate;

		    //wenn das "steps" array des aktuellen "instruments" an der stelle des aktiven beatIndex "true" als wert hat -> sample abspielen
		    if(!muted) {
					sample.playSample(volume, pitch, filter, filterFreq, delayTime, delayFeedback, delayCutoff, pannerRate);
				}
			}
		}
	};

	//solo instrument switchen
	$scope.changeSolo = function(instrument) {
		
		for (var i = 0; i < $scope.instruments.length; i++) {

			//wenn solo auf false gesetzt wird -> alle unmuten und mute switch wieder freischalten
			if(!$scope.instruments[instrument].solo) {
				$scope.instruments[i].muted = false;
				$scope.muteDisabled = false;
			} else {

				//wenn momentan betrachtetes instrument NICHT unser solo instrument ist -> muten und solo wegmachen
				if(i !== instrument) {
					$scope.instruments[i].muted = true;
					$scope.instruments[i].solo = false;
				}

				//alle mute switches disablen während solo an ist
				$scope.muteDisabled = true;

				//solo instrument immer unmuten
				$scope.instruments[instrument].muted = false;
			}
		};
	};

	//wann der nächste beat ausgelöst wird
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
			};
		};
	};

	//startet die clock und den loop
	$scope.startPlaying = function() {
		//wenn clock schon spielt, nicht nochmal den callback starten
		if($scope.isPlaying === false) {
			
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

	//aufnehmen eines wav files
	$scope.record = function(){
		if(!$scope.isRecording){
			if($scope.isPlaying === false){
				console.log('start');
				recorder.record();
				$scope.startPlaying();
				$scope.isRecording = true;
			} else{
				console.log('start without playing');
				recorder.record();
				$scope.isRecording = true;
			}
		}
	};

	//aufnahme stoppen und download dialog zeigen
	$scope.stopRecord = function($event){
		if($scope.isRecording){
			recorder.stop();
			$scope.isRecording = false;
			$scope.stopPlaying();
			$scope.showRecordFileDownloadDialog($event);
		}
	};

	//delay auf standardwerte zurücksetzen
	$scope.resetDelay = function(index) {
		$scope.instruments[index].delayTime = 0;
		$scope.instruments[index].delayFeedback = 0.4;
		$scope.instruments[index].delayCutoff = 20000;
	};
	
	//Export Pattern
	$scope.exportPattern = function(){
		var data = 'text/json;charset=utf-8,' + encodeURIComponent(angular.toJson($scope.instruments,true));

		//neuen button machen wenn nicht schon einer existiert, sonst nur href ändern
		if($('#downloadexportpattern').length) {
			$('#downloadexportpattern').attr('href', 'data:' + data);
		} else {
			$('<a href="data:' + data + '" download="data.json" id="downloadexportpattern"></a>').insertAfter( '#export' );
		}
		
		$('#downloadexportpattern').get(0).click();
	};

	window.onbeforeunload = function (event) {
		  
	  if (typeof event == 'undefined') {
	    event = window.event;
	  }
	  if (event) {
	  	if($scope.defaultsettings){
	  		return true;
	  	} else {
	  		localStorage.setItem("session",angular.toJson($scope.instruments));
	  	}
	  }
	  return true;
	}
	function showSessionWindow($event) {
	  var parentEl = angular.element(document.body);
	   	$mdDialog.show({
	     	parent: parentEl,
	     	targetEvent: $event,
	     	template:
	       	'<md-dialog aria-label="List dialog">' +
	       	'  <md-dialog-content>'+
	       	'		 <h2>Session</h2>'+
		      '  </md-dialog-content>' +
		      '  <div class="md-actions">' +
		      '    <md-button ng-click="loadDefault()" class="md-primary">' +
		      '      Create New Session' +
		      '    </md-button>' +
		      '    <md-button ng-click="loadSession()" class="md-primary">' +
		      '      Load Old Session' +
		      '    </md-button>' +
		      '  </div>' +
		      '</md-dialog>',
	    	controller: DialogController
	  	});
	  	
	  function DialogController(scope, $mdDialog) {
	    scope.closeDialog = function() {
	      $mdDialog.hide();
	      $scope.loadKit();
	    }
			scope.loadDefault = function(){
				scope.closeDialog();	
				$http.get('scripts/instruments.json').success(function(data){
		 			$scope.instruments = data.drums;
		 			$scope.defaultsettings = true;
		 			$scope.loadKit();
		 			$scope.wasloaded = true;
	 			});
				localStorage.removeItem("session");
			}
	    scope.loadSession = function(){
	    	delete $scope.instruments;
	    	var gotthesession = JSON.parse(localStorage.getItem("session"));
				$scope.instruments= gotthesession;
				$scope.defaultsettings = false;
	    	scope.closeDialog();
	    }
	  }
	}
	//show dialog zum herunterladen des aufgenommenen wav files
 	$scope.showRecordFileDownloadDialog = function($event) {
	  var parentEl = angular.element(document.body);
	   	
	  $mdDialog.show({
     	parent: parentEl,
     	targetEvent: $event,
     	template:
       	'<md-dialog aria-label="Download Recording Dialog">' +
       	'  <md-dialog-content id="download">'+
       	'		 <h2>Download Recording</h2>'+
       	'		 <p>Choose a file name (min. 4 characters) and download your beat in ".wav" format.</p>'+       	
       	'    <md-input-container class="md-primary"><label>File name</label><input name="filename" ng-model="filename" required md-maxlength="20" minlength="4"></md-input-container>'+
	      '  </md-dialog-content>' +
	      '  <div class="md-actions">' +
	      '    <md-button ng-click="closeDialog()" class="">' +
	      '      Cancel' +
	      '    </md-button>' +
	      '    <md-button ng-click="downloadRecordedFile()" class="md-accent">' +
	      '      Download' +
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
	      $scope.loadKit();
	    };
	    scope.filename = filename;
	    scope.downloadRecordedFile = function(){
	    	if(scope.filename.length >= 4){
		    	recorder.exportWAV(function(e){
  		    	recorder.clear();
  		    	Recorder.forceDownload(e, scope.filename + '.wav');
  		    	scope.closeDialog();
  				});	
	    	}
	    };
	  };
	};

	//show dialog zum importen eines patterns
 	$scope.showImportPatternDialog = function($event) {
	  var parentEl = angular.element(document.body);
	   	
	  $mdDialog.show({
     	parent: parentEl,
     	targetEvent: $event,
     	template:
       	'<md-dialog aria-label="Import Dialog">' +
       	'  <md-dialog-content id="import-pattern">'+
       	'		 <h2>Import</h2>'+
       	'		 <p>You can restore a previously saved beat by importing the "data.json" file which is generated when exporting a beat.</p>'+
        '		 <md-input-container>'+
        '			<input id="json-file" name="json-file" file-model="myFile" type="file" accept=".json">'+
        '		 </md-input-container>'+
	      '  </md-dialog-content>' +
	      '  <div class="md-actions">' +
	      '    <md-button ng-click="closeDialog()" class="">Cancel</md-button>' +
	      '    <md-button ng-click="importPattern()" class="md-accent">Import</md-button>' +
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
	    };
			// Import Pattern
			scope.importPattern = function(){
				var file = document.getElementById('json-file').files[0];
				var reader = new FileReader();

				//nur importen wenn auch wirklich etwas ausgewählt wurde.
				if(typeof file !== 'undefined') {
					reader.onload = function(e){
						$scope.instruments = [];
						var neuinst = JSON.parse(e.target.result);
						for (var i = 0; i < neuinst.length; i++) {
							$scope.instruments[i] = neuinst[i];
						};
						$scope.$apply();
						$scope.loadKit();
						scope.closeDialog();
					};

					reader.readAsText(file, 'UTF-8');
				} else {

				}
			};
	  };
	};

	var init = function() {   
		clock = new WAAClock(context, {toleranceEarly: 0.1});
		initBinCanvas();
	};

	//bei document.ready init funktion aufrufen
	angular.element(document).ready(function() {
		init();
		initVisualization();
	});

});