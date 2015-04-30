var context;
var clock;
var beatCount = -1;

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

var tempo = 120;
var beatDur = 60 / tempo;

var sixteenthNoteDur = beatDur / 4;

var barDur = 4 * beatDur;

function play() {
	var kick = LOADED_SOUNDBANK.kick;
	var snare = LOADED_SOUNDBANK.snare;
	var hihat = LOADED_SOUNDBANK.hihat;

	var startTime = context.currentTime;

	//startBeat(kick);
}

var startBeat = function(buffer, index) {
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
var nextBeatTime = function(index) {
	//vergangene zeit seitdem clock gestartet wurde
  var currentTime = context.currentTime;

  //in welchem bar wir gerade sind
  var currentBar = Math.floor(currentTime / barDur);

  //in welchem beat des aktuellen bars sind wir gerade
  var currentBeat = Math.round(currentTime % barDur);

	return (currentBar + 1) * barDur + 0 * beatDur;
}

var generateGrid = function() {

	$('#pattern .track-row').each(function() {

		var row = $(this);
		var rowName = row.data('sample');

		for(var beatInd = 0; beatInd < 8; beatInd++) {

			var beatWrap = $('<div class="beat-wrap beat_' + beatInd + '"><div class="beat" beatIndex='+ beatInd +'></div></div>');
			beatWrap.appendTo(row);
		}
	});
}

var beatClickHandler = function() {

	$('.beat').each(function() {

			var beat = $(this);
			var index = beat.attr('beatIndex');
			var rowName = beat.parent().parent().attr('data-sample');

			var track = LOADED_SOUNDBANK[rowName];

			beat.click(function() {

				if(!beat.hasClass('active')) {

					beat.addClass('active');
					startBeat(track, index);
				}
				else {

					beat.removeClass('active');
					//stopBeat(rowName, beatInd);
				}
			});
	})	
}

var uiNextBeat = function() {

	beatCount = (beatCount + 1) % 8;

	$('#pattern .beat-wrap').removeClass('active');
	$('#pattern .beat-wrap:nth-child(' + (beatCount + 1) + ')').addClass('active');


}

// function playSound(buffer) {

//   var source = context.createBufferSource();
//   source.buffer = buffer;
//   source.connect(context.destination);

//   if (!source.start)
//     source.start = source.noteOn;

//   source.start(0);
// }