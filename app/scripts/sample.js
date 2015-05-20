var context;
var biquadFilter;

//check ob audiocontext verfügbar ist
try {
    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    biquadFilter = context.createBiquadFilter();

} catch(e) {
	alert("Web Audio API is not supported in this browser");
}

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

Sample.prototype.playSample = function(volume, tune, lowPass) {

		var source = context.createBufferSource();
		source.buffer = this.buffer;

		//set volume
		var gain = context.createGain();
		gain.gain.value = volume;

		//set tune
		source.playbackRate.value = tune;

		if(lowPass) {
			source.connect(biquadFilter);
	  	biquadFilter.connect(context.destination);
			biquadFilter.type = "lowpass";
	  	biquadFilter.frequency.value = 1000;
	  	biquadFilter.gain.value = 25;
		} else {
			source.connect(gain);
		}

		gain.connect(context.destination);

	  //fallback, falls source.start nicht existiert
	  if (!source.start) {
	    source.start = source.noteOn;
		}
	
	  source.start(0);
}