(function () {
  var width = 522; // We will scale the photo width to this
  var height = 0; // This will be computed based on the input stream

  var streaming = false;

  var video = null;
  var canvas = null;
  var photo = null;
  var startbutton = null;

  function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function (err) {
        console.log('An error occurred: ' + err);
      });

    video.addEventListener(
      'canplay',
      function (ev) {
        if (!streaming) {
          height = video.videoHeight / (video.videoWidth / width);

          if (isNaN(height)) {
            height = width / (4 / 3);
          }

          video.setAttribute('width', width);
          video.setAttribute('height', height);
          canvas.setAttribute('width', width);
          canvas.setAttribute('height', height);
          streaming = true;
        }
      },
      false
    );

    startbutton.addEventListener(
      'click',
      function (ev) {
        takepicture();
        ev.preventDefault();
      },
      false
    );

    clearphoto();
  }

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = '#AAA';
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/jpeg');
    // photo.setAttribute('src', data);
  }

  function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      document.getElementById('hidden-para').hidden = false;
      var data = canvas.toDataURL('image/jpeg');
      //   photo.setAttribute('src', data);
      fetch(data)
        .then((res) => res.blob())
        .then((blobData) => {
          uploadData(blobData);
          setTimeout(function () {
            window.location.href = 'http://localhost:3000/get-mood';
          }, 10000);
        });
    } else {
      clearphoto();
    }
  }
  window.addEventListener('load', startup, false);
})();

function uploadData(blob) {
  let filename = new Date().toISOString();
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function (e) {
    if (this.readyState === XMLHttpRequest.DONE) {
      console.log('Done');
    }
  };
  let formData = new FormData();
  formData.append('webcam_data', blob, filename);
  xhr.open('POST', '/get-mood', true);
  xhr.send(formData);
}
