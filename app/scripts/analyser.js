var c = null;
var ctx = null;
var rafID = null;
var analyser = context.createAnalyser();
var drawVisual;

function initVisualization() {
	//start updating
	rafID = window.requestAnimationFrame(updateVisualization);
}

function updateVisualization () {
	// get the average, bincount is fftsize / 2
	var array = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(array);

	drawBars(array);		

	rafID = window.requestAnimationFrame(updateVisualization);
}

function initBinCanvas () {

	//add new canvas
	c = document.getElementById("canvas");
	
	var w = $(window);

	var dimensions = {

		width: w.width(),
		height: w.height()
	}

	c.width = dimensions.width;
	c.height = dimensions.height;
	//get context from canvas for drawing
	ctx = c.getContext("2d");

	//create gradient for the bins
	var gradient = ctx.createLinearGradient(0,0,0,300);
	gradient.addColorStop(1,'#000000'); //black
	gradient.addColorStop(0.75,'#ff0000'); //red
	gradient.addColorStop(0.25,'#ffff00'); //yellow
	gradient.addColorStop(0,'#ffffff'); //white

	//set new gradient as fill style
	ctx.fillStyle = gradient;
}

function drawBars (array) {

	WIDTH = canvas.width;
  	HEIGHT = canvas.height;

	analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    function drawBars() {
      drawVisual = requestAnimationFrame(drawBars);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        ctx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

        x += barWidth + 1;
      }
    };
    drawBars();
}

//calc the color for the spectral based on the value "v"
function getColor (v) {
	var maxVolume = 255;
	//get percentage of the max volume
	var p = v / maxVolume;
	var np = null;

	if (p < 0.05) {
		np = [0,0,0] //black
	//p is between 0.05 and 0.25
	} else if (p < 0.25) {
		np = [parseInt(255 * (1-p)),0,0] //between black and red
	//p is between 0.25 and 0.75
	} else if (p < 0.75) {
		np = [255,parseInt(255 * (1-p)),0];	 //between red and yellow
	//p is between 0.75 and 1
	} else {
		np = [255,255,parseInt(255 * (1-p))]; //between yellow and white
	}

	return 'rgb('+ (np[0]+","+np[1]+","+np[2]) + ")";
}