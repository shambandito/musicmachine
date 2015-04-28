var context;
var clock;

var LOADED_SOUNDBANK = {};

// An object to track the buffers to load {name: path}
var SOUNDBANK = {
  kick: 'samples/kickdrum1.wav',
  snare: 'samples/snaredrum1.wav',
  hihat: 'samples/hihat1.wav',
};

//check if audiocontext available on pageload
function loadBuffers() {
	  var names = [];
	  var paths = [];

	  //save each samples name and path in a separate array
	  for (var name in SOUNDBANK) {
	    var path = SOUNDBANK[name];
	    names.push(name);
	    paths.push(path);
	  }

    //load our samples
	  bufferLoader = new BufferLoader(context, paths, function(bufferList) {
	  		for (var i = 0; i < bufferList.length; i++) {

			    var buffer = bufferList[i];
			    var name = names[i];

			    //save each SAMPLE with name as key in our loaded soundbank		    
			    LOADED_SOUNDBANK[name] = buffer;
			  }
	  });

	  bufferLoader.load();
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    clock = new WAAClock(context, {toleranceEarly: 0.1});
  }
  catch(e) {
    alert("Web Audio API is not supported in this browser");
  }

  loadBuffers();
});


var tempo = 120;
var beatDur = 60 / tempo;

var sixteenthNoteDur = beatDur / 4;

var barDur = 4 * beatDur;

function play() {
	var kick = LOADED_SOUNDBANK.kick;
	var snare = LOADED_SOUNDBANK.snare;
	var hihat = LOADED_SOUNDBANK.hihat;

	var startTime = context.currentTime;

	clock.start();

	startBeat(kick);
}

var startBeat = function(buffer) {
	console.log("HEHEJO");
  var event = clock.callbackAtTime(function(event) {

	  var source = context.createBufferSource();
	  source.buffer = buffer;
	  source.connect(context.destination);

    source.start(event.deadline);

  }, nextBeatTime());

  event.repeat(barDur);
  event.tolerance({late: 0.01});
}


//@TODO: HIER MUSS EIGENTLICH NOCH BEATIND MIT REIN!!!!
var nextBeatTime = function() {
	//vergangene zeit seitdem clock gestartet wurde
  var currentTime = context.currentTime;

  //in welchem bar wir gerade sind
  var currentBar = Math.floor(currentTime / barDur);

  //in welchem beat des aktuellen bars sind wir gerade
  var currentBeat = Math.round(currentTime % barDur);

  console.log((currentBar + 1) * barDur + 1 * beatDur);

	return (currentBar + 1) * barDur + 0 * beatDur;
}

// function playSound(buffer) {

//   var source = context.createBufferSource();
//   source.buffer = buffer;
//   source.connect(context.destination);

//   if (!source.start)
//     source.start = source.noteOn;

//   source.start(0);
// }