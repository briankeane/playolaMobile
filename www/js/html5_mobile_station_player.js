angular.module('starter')

.service('StationPlayer', function (StationsSvc, $rootScope, $interval, $timeout) {

  // initialize variables
  var self = this;
  self.muted = false;
  self.volumeLevel = 1.0;
  self.musicStarted = false;
  self.audioQueue = [];
  this.timeouts = [];

  // set up audio context and audio nodes
  if (!self.context) {
    if ('webkitAudioContext' in window) {
      self.context = new webkitAudioContext;
    } else {
      self.context = new AudioContext();
    }
  }
  self.gainNode = this.context.createGain();
  self.gainNode.connect(this.context.destination);


  // *************************************************
  // *         initialize(attrs)                     *
  // *************************************************
  // * takes an attrs object with listenStationId,   *
  // *   & audioQueue.  Clears out the old info and  *
  // *   loads the new info
  // *************************************************  
  this.initialize = function(attrs) {
    // load station-specific variables
    self.clearPlayer();

    self.stationId = attrs.listenStationId;
    self.audioQueue = attrs.audioQueue;
    self.musicStarted = false;

    $rootScope.audioQueue = self.audioQueue;
    $rootScope.$broadcast('audioQueueUpdated');
    
    self.startPlayer();
  };

  var getCommercialBlockForBroadcast = function(currentPosition) { 
    // TO DO -----------------------------------------------------------------------
    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------
  };

  var updateAudioQueue = function() {
      
    // get the newest spin
    var spinInfo = {};
    spinInfo.currentPosition = self.audioQueue[self.audioQueue.length - 1].currentPosition + 1;
    spinInfo.lastCurrentPosition = spinInfo.currentPosition;
    spinInfo.stationId = self.stationId;
    
    StationsSvc.getSpinByCurrentPosition(spinInfo)
    .success(function (result) {
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
          var spinInfo = {};
          spinInfo.currentPosition = result.currentPosition;
          spinInfo.stationId = self.stationId;  
    
          StationsSvc.getCommercialBlockForBroadcast(result.currentPosition)
          .success(function (result) {
            self.audioQueue.push(result);
            $rootScope.audioQueue = self.audioQueue;
            $rootScope.$broadcast('audioQueueUpdated');
          });
        }
        
      // make recursive calls until audioQueue is filled
      if (self.audioQueue.length < 3) {
        updateAudioQueue();
      }

      $rootScope.$broadcast('audioQueueUpdated');
    });

  };

  this.advanceSpin = function() {
    // advance audioQueue
    self.justPlayed = self.audioQueue.shift();
    $rootScope.audioQueue = self.audioQueue;
    $rootScope.$broadcast('audioQueueUpdated');

    // start the next spin
    self.audioQueue[0].source.start(0);
    self.audioQueue[0].source.started = true;

    // grab new songs if necessary
    if (self.audioQueue.length<3) {
      updateAudioQueue();
    }

    // set the next advance
    var msTillAdvanceSpin = (self.audioQueue[1].airtime_in_ms - Date.now());
    var newTimeout = $timeout(function() { self.advanceSpin(); }, msTillAdvanceSpin);
    self.timeouts.push(newTimeout);

    // // report the listen
    reportListen();
  };

  function reportListen() {
    // TO DO -----------------------------------------------------------------------
    // -----------------------------------------------------------------------------
    // -----------------------------------------------------------------------------
  };

  this.startPlayer = function () {
    // load the first spin alone
    loadAudio(self.audioQueue[0].key);

    // load the rest after the 1st spin is finished
    $rootScope.$on('playerStarted', function() {    // once 1st song has been loaded
      for (var i=1; i<self.audioQueue.length; i++) {
        loadAudio(self.audioQueue[i].key);
      }
    });

  }; // end this.startPlayer

  this.nowPlaying = function() {
    return self.audioQueue[0];
  };

  this.clearPlayer = function() {
    // stop currently playing or downloading spins
    self.audioQueue.forEach(function (spin) {
      if (spin.hasOwnProperty('source') && (spin.source.started)) {
        spin.source.stop(0);
      }
      if (spin.hasOwnProperty('req')) {
        spin.req.abort();
      }
    });

    self.audioQueue = [];

    // cancel future advance advanceSpin triggers
    self.timeouts.forEach(function (timeout) {
      $timeout.cancel(timeout);
    });
    self.timeouts = [];
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

        var index = getAudioQueueIndexByKey(url);
        if (index != -1) {
          self.audioQueue[index].source = source;
        }
        
        // if it's the first station spin, start it in the proper place
        if (!self.musicStarted) {

          // if it's still within the 1st spin's airtime
          if ((new Date() < self.audioQueue[1].airtime_in_ms)) {
            self.musicStarted = true;
            self.audioQueue[0].source.start(0,(Date.now() - self.audioQueue[0].airtime_in_ms)/1000);
            self.audioQueue[0].source.started = true;

            // set advance
            var msTillAdvanceSpin = (self.audioQueue[1].airtime_in_ms - Date.now());
            var newTimeout = $timeout(function() { self.advanceSpin(); }, msTillAdvanceSpin);
            self.timeouts.push(newTimeout);
            $rootScope.$broadcast('playerStarted');
          } else {   // advance time passed during loading
            
            self.justPlayed = self.audioQueue.shift();
            loadAudio(self.audioQueue[0].key);
            $rootScope.$broadcast('spinAdvanced');
          }
        }
      });
    };

    // store the req in audioQueue for later cancellation if necessary
    var index = getAudioQueueIndexByKey(url);
    self.audioQueue[index].req = request;

    request.send();
  }


  // **********************************************
  // *   getAudioQueueIndexByKey(key)             *
  // **********************************************
  // * takes a key and returns the matching index *
  // *  -- returns -1 if not found                *
  // **********************************************       
  function getAudioQueueIndexByKey(key) {
    for (var i=0; i<self.audioQueue.length; i++) {
      if (self.audioQueue[i].key === key) {
        return i;
      }
    }
    return -1;
  }
})