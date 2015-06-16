var context;

//check ob audiocontext verfügbar ist
try {
    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    context = new AudioContext();

    //recorderNode erstellen
    var recorderNode = context.createGain();
    recorderNode.gain.value = 0.7;

    //tuna effects object erstellen
    var tuna = new Tuna(context);

} catch(e) {
	alert("Web Audio API is not supported in this browser");
}


//sample objekt konstruktor
function Sample(path) {

	var mySample = this;
	var request = new XMLHttpRequest();

	mySample.buffer;
	mySample.path = path;

  request.open('GET', mySample.path, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      mySample.buffer = buffer;
    });
  }
  request.send();
}

//"klassenfunktion" zum abspielen der einzelnen sample objekte
Sample.prototype.playSample = function(volume, tune, filter, filterFreq, delayTime, delayFeedback, delayCutoff, phaserRate, pannerRate) {

		var hasDelay = (delayTime !== 0);
		var hasPhaser = (phaserRate !== 0);
		var hasFilter = (filter !== 'none');

		if(hasDelay) {
			var delayNode = new tuna.Delay({
					feedback: delayFeedback, // 0 to 1+
					delayTime: delayTime,    // how many milliseconds should the wet signal be delayed? 
					wetLevel: 0.25,    			 // 0 to 1+
					dryLevel: 0,       			 // 0 to 1+
					cutoff: delayCutoff,     // cutoff frequency of the built in lowpass-filter. 20 to 22050
					bypass: 0
	    });
		}

		if(hasPhaser) {
			var phaserNode = new tuna.Phaser({
	        rate: phaserRate,              //0.01 to 8 is a decent range, but higher values are possible, standard was 1.2
	        depth: 0.3,                    //0 to 1
	        feedback: 0.2,                 //0 to 1+
	        stereoPhase: 30,               //0 to 180
	        baseModulationFrequency: 700,  //500 to 1500
	        bypass: 0
	    });
		}

		if(hasFilter) {
			var filterNode = new tuna.Filter({
	         frequency: filterFreq, // 20 to 22050
	         Q: 1,                  // 0.001 to 100
	         gain: 0,               // -40 to 40
	         filterType: filter,    // 0 to 7, corresponds to the filter types in the native filter node: lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
	         bypass: 0
	    });
		}

		//audio source node erstellen
		var source = context.createBufferSource();
		source.buffer = this.buffer;

		//pannerNode erstellen und Wert setzen
		var pannerNode = context.createPanner();
		pannerNode.panningModel = "equalpower";
		pannerNode.setPosition(pannerRate, 0, 1 - Math.abs(pannerRate));
		
		//volumeNode erstellen und wert setzen
		var volumeNode = context.createGain();
		volumeNode.gain.value = volume;

		//set tune
		source.playbackRate.value = tune;

		//sample direkt an pannerNode und dann volumeNode connecten
		source.connect(pannerNode);
		pannerNode.connect(volumeNode);

		if (hasDelay && hasPhaser && hasFilter) { // ALLES AN

			volumeNode.connect(delayNode.input);

			delayNode.connect(phaserNode.input);

      phaserNode.connect(filterNode.input);

      filterNode.connect(analyser);

		} else if (hasDelay && hasPhaser && !hasFilter) { // DELAY UND PHASER

			volumeNode.connect(delayNode.input);

			delayNode.connect(phaserNode.input);

			phaserNode.connect(analyser);

		} else if (hasDelay && !hasPhaser && hasFilter) { // DELAY UND FILTER

			volumeNode.connect(delayNode.input);

      delayNode.connect(filterNode.input);

      filterNode.connect(analyser);

		} else if (hasDelay && !hasPhaser && !hasFilter) { // NUR DELAY

			volumeNode.connect(delayNode.input);

			delayNode.connect(analyser);

		} else if (!hasDelay && hasPhaser && hasFilter) { // PHASER UND FILTER

			volumeNode.connect(phaserNode.input);

      phaserNode.connect(filterNode.input);

      filterNode.connect(analyser);
 
		} else if (!hasDelay && hasPhaser && !hasFilter) { // NUR PHASER

			volumeNode.connect(phaserNode.input);

			phaserNode.connect(analyser);

		} else if (!hasDelay && !hasPhaser && hasFilter) { // NUR FILTER

      volumeNode.connect(filterNode.input);

      filterNode.connect(analyser);

		} else if (!hasDelay && !hasPhaser && !hasFilter) { // NICHTS

			volumeNode.connect(analyser);

		}

























		/*



		//wenn delayTime ausgewählt wurde, delay setzen und sample an delayNode connecten
		if(hasDelay) {

			delayNode = new tuna.Delay({
				feedback: delayFeedback, // 0 to 1+
				delayTime: delayTime,    // how many milliseconds should the wet signal be delayed? 
				wetLevel: 0.25,    			 // 0 to 1+
				dryLevel: 0,       			 // 0 to 1+
				cutoff: delayCutoff,     // cutoff frequency of the built in lowpass-filter. 20 to 22050
				bypass: 0
      });

			volumeNode.connect(delayNode.input);
		} 

		//@TODO: PHASER
		//if phaser exists
		//falls delay existiert -> delayNode an phaser node
		//sonst -> volumeNode an phaser node

		if(hasPhaser) {
			phaserNode = new tuna.Phaser({
        rate: phaserRate,              
        depth: 0.3,                    //0 to 1
        feedback: 0.2,                 //0 to 1+
        stereoPhase: 30,               //0 to 180
        baseModulationFrequency: 700,  //500 to 1500
        bypass: 0
       });
			if (delayTime !== 0) {
				delayNode.connect(phaserNode.input);
			}
			else {
				volumeNode.connect(phaserNode.input);
			}
		}

		//wenn ein filter ausgewählt wurde
		if(filter !== 'none') {

			//filterNode erstellen und werte setzen
			filterNode = new tuna.Filter({
         frequency: filterFreq, // 20 to 22050
         Q: 1,                  // 0.001 to 100
         gain: 0,               // -40 to 40
         filterType: filter,    // 0 to 7, corresponds to the filter types in the native filter node: lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
         bypass: 0
      });

			//@TODO:
			//wenn phaser code vorhanden ist:
			//wenn phaser vorhanden -> phaserNode an filter connecten
			//sonst ->
			//falls delayNode vorhanden -> delayNode an filter connecten
			//sonst -> volumeNode an filter connecten

			if(phaserRate !== 0) {

				if(delayTime != 0 ) {
					phaserNode.connect(delayNode.input)
				} else {
					phaserNode.connect(filterNode.input)
				}
			} else {

				//delayNode an filter connecten, falls delay gesetzt wurde
				if(delayTime !== 0) {
					delayNode.connect(filterNode.input);
				} else {
					//volumeNode an filter connecten
					volumeNode.connect(filterNode.input);			
				}
			}

			//filter an analyser connecten
	  	filterNode.connect(analyser);

		} else {
			//wenn phaser an und filter aus
			if(phaserRate !== 0) {
				
				if(delayTime != 0 ) {
					phaserNode.connect(delayNode.input)
				} else {
					phaserNode.connect(analyser)
				}
			} else {
				//filter aus, phaser aus
			}
	
			//falls kein filter gesetzt wurde
			//delayNode an analyser connecten
			if(delayTime !== 0) {
				delayNode.connect(analyser);
			}	else {
				
				//volumeNode an analyser connecten
				volumeNode.connect(analyser);
			}
		}
		*/

		//analyser direkt an context connecten
		analyser.connect(context.destination);

		//analyser an recorder connecten
		analyser.connect(recorderNode);

	  //fallback, falls source.start nicht existiert
	  if (!source.start) {
	    source.start = source.noteOn;
		}
		
	  source.start(0);
}

var recorder = new Recorder(recorderNode, {
  workerPath: "/scripts/recorderWorker.js"
});