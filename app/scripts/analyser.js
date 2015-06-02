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

	WIDTH = c.width;
	HEIGHT = c.height;

	//get context from canvas for drawing
	ctx = c.getContext("2d");
}

function drawBars (array) {
	analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    function drawBars() {
      drawVisual = requestAnimationFrame(drawBars);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(238, 238, 238)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        ctx.fillStyle = 'rgb(63, 81, ' + (barHeight + 80) + ')';
        ctx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
    };
    drawBars();
}