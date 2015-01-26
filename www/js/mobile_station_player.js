angular.module('starter.controllers')

.service('StationPlayer', function (StationsSvc, $rootScope) {

  this.self = this;

  var initialize = function(attrs) {
    this.musicStarted = false;
    this.stationId = attrs.listenStationid;
    this.audioQueue = attrs.audioQueue;
    this.muted = false;
    this.volumeLevel = 1.0;
    this.self = this;
    startPlayer();
  }

  this.stop = function () {
    if (self.hasOwnProperty('audioQueue')) {
      self.audioQueue.forEach(function (spin) {
        if (spin.hasOwnProperty('media')) {
          spin.media.stop();
        }
      });
    }
    initialize(attrs);
  };

  function startPlayer() {
    var song = StationsSvc.downloadSong(self.audioQueue[0], function(entry) {
      alert('download complete callback started');
      self.audioQueue[0].media = new Media((cordova.file.dataDirectory + self.audioQueue[0].filename).replace('file://',''));
      
      if (!self.musicStarted) {
        // if it's still within the 1st spin's airtime
        if ((new Date() < self.audioQueue[1].airtime_in_ms)) {
          self.musicStarted = true;
          self.audioQueue[0].media.play();
          self.audioQueue[0].media.seekTo(50000);
          $rootScope.$broadcast('playerStarted');
        } else {   // advance time passed during loading
          alert('not in time');
        }
      }
    });
  }

  function onSuccess() {
    alert('success');
    self.audioQueue[0].artist = 'success';
  }

  function onError(error) {
    alert('error');
    self.audioQueue[0].artist =  error.code + '\n' +
           'message: ' + error.message + '\n';
  }
})