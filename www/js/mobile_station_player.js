angular.module('starter.controllers')

.service('StationPlayer', function (StationsSvc, $rootScope) {

  var initialize = function(attrs) {
    // store necessary stuff
    this.musicStarted = false;
    this.stationId = attrs.listenStationId;
    this.audioQueue = attrs.audioQueue;
    this.muted = false;
    this.volumeLevel = 1.0;
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.self = this;
    startPlayer();
  }


  this.restart = function(attrs) {
    if (self.hasOwnProperty(audioQueue)) {
      // stop current songs from playing
      self.audioQueue.forEach(function (spin) {
        spin.audio.stop();
      });
    }

    // reinitialize
    initialize(attrs);
  }

  var getCommercialBlockForBroadcast = function(currentPosition) {
    
    var callback = function(result) {
      self.audioQueue.push(result);
      loadAudio(self.audioQueue[self.audioQueue.length - 1].key);
    };

    var spinInfo = {};
    spinInfo.currentPosition = currentPosition;
    spinInfo.stationId = self.stationId;  
    
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: '/stations/get_commercial_block_for_broadcast',
        contentType: 'application/json',
        data: spinInfo,
        success: callback
    });
  };

  var updateAudioQueue = function() {
      
    // create callback for ajax request
    var callback = function(result) {
      console.log(result);
      var newSong = {};

      // reformat response for js
      if (result.type != 'CommercialBlock') {
        result.artist = result.audio_block.artist;
        result.title = result.audio_block.title;
      }

      self.audioQueue.push(result);
      var index = self.audioQueue.length - 1;
      loadAudio(result.key);

      // if commercials follow that spin
      if (result["commercials_follow?"]) {
        getCommercialBlockForBroadcast(result.currentPosition);
      }
      
      // make recursive calls until audioQueue is filled
      if (self.audioQueue.length < 3) {
        updateAudioQueue();
      }
    };
      
    // get the newest spin
    var spinInfo = {};
    spinInfo.currentPosition = self.audioQueue[self.audioQueue.length - 1].currentPosition + 1;
    spinInfo.lastCurrentPosition = spinInfo.currentPosition;
    spinInfo.stationId = self.stationId;
    
    StationsSvc.getSpinByCurrentPosition(spinInfo).success(function (result) {
                                                      callback(result)
                                                    });

  };

  var advanceSpin = function() {
    console.log('advancing spin...');

    if (!self.musicStarted) {
      return;
    }

    // advance audioQueue
    self.justPlayed = self.audioQueue.shift();

    self.audioQueue[0].source.start(0); 

    // grab the new songs if necessary
    if (self.audioQueue.length<3) {
      updateAudioQueue();
    }

    // set the next advance
    var msTillAdvanceSpin = (self.audioQueue[1].airtime_in_ms - Date.now());
    setTimeout(function() { advanceSpin(); }, msTillAdvanceSpin);

    // report the listen
    reportListen();

    $rootScope.$broadcast('spinAdvanced');
    
  };

  function reportListen() {
    // TO DO -----------------------------------------------------------------------
    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------
  };

  function startPlayer() {
    loadAudio(self.audioQueue[0].key);

    $rootScope.$on('playerStarted', function() {    // once 1st song has been loaded
      for (var i=0; i<self.audioQueue.length; i++) {
        loadAudio(self.audioQueue[i].key);
      }
      
      var msTillAdvanceSpin = (self.audioQueue[1].airtime_in_ms - Date.now());
      setTimeout(function() { advanceSpin(); }, msTillAdvanceSpin);
    });

    // set the next advance

  }; // end this.startPlayer

  this.nowPlaying = function() {
    return self.audioQueue[0];
  };

  this.mute = function() {
    if (self.muted === false) {
      self.muted = true;
      self.gainNode.gain.value = 0;
    }
  };

  this.unMute = function() {
    if (self.muted === true) {
      self.muted = false;
      self.gainNode.gain.value = self.volumeLevel;
    }
  };

  function loadAudio(url) {
    var context = self.context;
    var request = new XMLHttpRequest();
    request.open('Get', url, true);
    request.responseType = 'arraybuffer';

    // decode
    request.onload = function() {
      context.decodeAudioData(request.response, function(buffer) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(self.gainNode);
        for (var i=0; i<self.audioQueue.length; i++) {
          var foundAMatch = false;
          if (self.audioQueue[i].key === url) {
            foundAMatch = true;
            self.audioQueue[i].source = source;
            
            // if it's the first station spin, start it in the proper place
            if (!self.musicStarted) {

              // if it's still within the 1st spin's airtime
              if ((new Date() < self.audioQueue[1].airtime_in_ms)) {
                self.musicStarted = true;
                source.start(0,(Date.now() - self.audioQueue[0].airtime_in_ms)/1000);
                $rootScope.$broadcast('playerStarted');
              } else {   // advance time passed during loading
                
                self.justPlayed = self.audioQueue.shift();
                loadAudio(self.audioQueue[0].key);
                $rootScope.$broadcast('spinAdvanced');
              }
            }
          }
        }  //endfor
      });
    };
    request.send();
  }
})