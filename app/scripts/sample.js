'use strict';

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
	alert('Web Audio API is not supported in this browser');
}


//sample objekt konstruktor
function Sample(path) {

	var mySample = this;
	var request = new XMLHttpRequest();

	mySample.path = path;

  request.open('GET', mySample.path, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      mySample.buffer = buffer;
    },
    function(buffer) {
      console.log("Error decoding drum samples!");
    });
  };
  request.send();
}

//"klassenfunktion" zum abspielen der einzelnen sample objekte
Sample.prototype.playSample = function(volume, tune, filter, filterFreq, delayTime, delayFeedback, delayCutoff, pannerRate) {

		var hasDelay = (delayTime !== 0);
		var hasFilter = (filter !== 'none');

		var delayNode, filterNode;

		if(hasDelay) {
			delayNode = new tuna.Delay({
					feedback: delayFeedback, // 0 to 1+
					delayTime: delayTime,    // how many milliseconds should the wet signal be delayed? 
					wetLevel: 0.5,    			 // 0 to 1+
					dryLevel: 0,       			 // 0 to 1+
					cutoff: delayCutoff,     // cutoff frequency of the built in lowpass-filter. 20 to 22050
					bypass: 0
	    });
		}

		if(hasFilter) {
			filterNode = new tuna.Filter({
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
		pannerNode.panningModel = 'equalpower';
		pannerNode.setPosition(pannerRate, 0, 1 - Math.abs(pannerRate));
		
		//volumeNode erstellen und wert setzen
		var volumeNode = context.createGain();
		volumeNode.gain.value = volume;

		//set tune
		source.playbackRate.value = tune;

		//sample direkt an pannerNode und dann volumeNode connecten
		source.connect(pannerNode);
		pannerNode.connect(volumeNode);

		if (hasDelay && hasFilter) { // FILTER & DELAY

			volumeNode.connect(delayNode.input);

			delayNode.connect(filterNode.input);

      filterNode.connect(analyser);

		} else if (hasDelay && !hasFilter) { // DELAY

			volumeNode.connect(delayNode.input);

			delayNode.connect(analyser);

		} else if (!hasDelay && hasFilter) { // FILTER

			volumeNode.connect(filterNode.input);

      filterNode.connect(analyser);
 
		} else if (!hasDelay && !hasFilter) { // NICHTS

			volumeNode.connect(analyser);

		}

		//analyser direkt an context connecten
		analyser.connect(context.destination);

		//analyser an recorder connecten
		analyser.connect(recorderNode);

	  //fallback, falls source.start nicht existiert
	  if (!source.start) {
	    source.start = source.noteOn;
		}
		
	  source.start(0);
};

var recorder = new Recorder(recorderNode, {
  workerPath: '/scripts/helpers/recorderWorker.js'
});