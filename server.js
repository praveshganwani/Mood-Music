const http = require('http');
const express = require('express');
const multer = require('multer');
const util = require('util');
const app = express();
const upload = multer();
const fs = require('fs');
const path = require('path');
const msRest = require('@azure/ms-rest-js');
const Face = require('@azure/cognitiveservices-face');
const uuid = require('uuid/v4');
var SpotifyWebApi = require('spotify-web-api-node');

app.use(express.static('public'));
app.use(express.static('images'));

app.set('port', '3000');

const bodyParser = require('body-parser');
const { type } = require('os');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const server = http.createServer(app);
server.on('listening', () => {
  console.log('Listening on port 3000');
});

server.listen('3000');

var imageUrl;
var maxEmotion = null;
var maxEmotionValue = -1;
var emotions = {};
var blobData = null;

app.post('/get-mood', upload.any(), (req, res) => {
  imageUrl = req.body.image_url;
  blobData = req.files[0].buffer;
  var key = '6dc2207ca4e1470480cc63e393cf8dcd';
  var endpoint = 'https://moodmusic.cognitiveservices.azure.com/';
  const credentials = new msRest.ApiKeyCredentials({
    inHeader: { 'Ocp-Apim-Subscription-Key': key },
  });
  const client = new Face.FaceClient(credentials, endpoint);
  (async () => {
    let detected_faces = await client.face.detectWithStream(
      req.files[0].buffer,
      {
        returnFaceAttributes: ['Emotion'],
        // We specify detection model 1 because we are retrieving attributes.
        detectionModel: 'detection_01',
      }
    );
    console.log(detected_faces.length + ' face(s) detected');
    console.log('Face attributes for face(s) in');
    detected_faces.forEach(async function (face) {
      console.log(face.faceAttributes.emotion);
      emotions = face.faceAttributes.emotion;
    });
    for (let [key, value] of Object.entries(emotions)) {
      if (value > maxEmotionValue) {
        maxEmotionValue = value;
        maxEmotion = key;
      }
    }
    // res.render('mood.html', {
    //   emotions: emotions,
    //   maxEmotion: maxEmotion,
    //   maxEmotionValue: maxEmotionValue,
    // });
  })();
});

app.get('/get-mood', (req, res) => {
  console.log(emotions);
  console.log(maxEmotion);
  console.log(maxEmotionValue);
  res.render('mood.html', {
    imageUrl: 'data:image/jpeg;base64,' + blobData.toString('base64'),
    emotions: emotions,
    maxEmotion: maxEmotion,
    maxEmotionValue: maxEmotionValue,
  });
});

const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify',
];

var spotifyApi = new SpotifyWebApi({
  redirectUri: 'http://localhost:3000/playlists',
  clientId: '18d114b76aab4c62978ee00438926733',
  clientSecret: 'f244f3cc42a1457f989df9e0cacdbb13',
});

app.get('/spotify', function (req, res) {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

app.get('/playlists', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.log('Callback error: ', error);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];
      const expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      // setInterval(async () => {
      //   const data = await spotifyApi.refreshAccessToken();
      //   const access_token = data.body['access_token'];
      //   spotifyApi.setAccessToken(access_token);
      // }, (expires_in / 2) * 1000);

      return spotifyApi.searchTracks(maxEmotion);
    })
    .then(function (data) {
      var playlist = [];
      var items = data.body.tracks.items;
      console.log(items);
      for (let [key, value] of Object.entries(items)) {
        var song = {};
        song.id = parseInt(key) + 1;
        song.songImageUrl = value.album.images[1].url;
        song.songName = value.name;
        song.popularity = value.popularity;
        song.artist = value.artists[0].name;
        song.songUrl = value.external_urls.spotify;
        song.songPreview = value.preview_url;
        song.releaseDate = value.album.release_date;
        song.releasePrecision =
          value.album.release_date_precision.charAt(0).toUpperCase() +
          value.album.release_date_precision.slice(1);
        song.songDuration = millisToMinutesAndSeconds(value.duration_ms);
        console.log(song);
        playlist.push(song);
      }
      res.render('playlist.html', {
        playlist: playlist,
        maxEmotion: maxEmotion,
      });
    })
    .catch((error) => {
      console.log(error);
    });
});
