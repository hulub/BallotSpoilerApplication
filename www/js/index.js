
var video = document.createElement('video');
var canvasElement = document.getElementById('canvas');
var canvas = canvasElement.getContext('2d');
var recording = false

$(function () {
  app.initialize()
})

$('#start').on('click', startCameraRecording)
$('#stop').on('click', stopCameraRecording)

var app = {
  // Application Constructor
  initialize: function () {
    app.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    $(document).bind('deviceready', app.onDeviceReady);
  },

  onDeviceReady: function () {
    $('#header').show()
  }
}

function startCameraRecording() {
  recording = true

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  }).then(function (stream) {
    video.srcObject = stream;
    video.setAttribute('playsinline', true); // required to tell iOS safari we don't want fullscreen
    video.play();
    requestAnimationFrame(tick);
  }).catch(function(err) {
    alert('error')
  });
}

function stopCameraRecording() {
  recording = false
  if (video.srcObject)
    video.srcObject.getTracks().forEach(function (track) {
      track.stop()
    });
  video.pause();
}

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {

    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
  }

  if (recording)
    requestAnimationFrame(tick);
}