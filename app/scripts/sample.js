var context;
var biquadFilter;
//check ob audiocontext verfügbar ist
try {
    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    context = new AudioContext();
    var recorderNode = context.createGain();
    recorderNode.gain.value = 0.7;
    biquadFilter = context.createBiquadFilter();


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
Sample.prototype.playSample = function(volume, tune, filter, filterFreq) {

		var source = context.createBufferSource();
		source.buffer = this.buffer;
		console.log(source);
		//set volume
		var volumeNode = context.createGain();
		volumeNode.gain.value = volume;

		//set tune
		//@TODO: wird noch nicht angewandt
		source.playbackRate.value = tune;

		//sample direkt an volumeNode connecten

		source.connect(volumeNode);

		//wenn lowPass "true" -> filter aktivieren
		if(filter !== 'none') {

			//volumeNode an filter connecten
			volumeNode.connect(biquadFilter);

	  	//filter eigenschaften
			biquadFilter.type = filter;
	  	biquadFilter.frequency.value = filterFreq;
	  	biquadFilter.gain.value = 25;

			//filter an context connecten
	  	biquadFilter.connect(context.destination);
		} else {

			//volumeNode direkt an context connecten
			volumeNode.connect(recorderNode);
			volumeNode.connect(context.destination);
		}

	  //fallback, falls source.start nicht existiert
	  if (!source.start) {
	    source.start = source.noteOn;
		}
		
	  source.start(0);
}
 var recorder = new Recorder(recorderNode, {
      workerPath: "/scripts/recorderWorker.js"
    });