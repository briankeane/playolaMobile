angular.module('starter.controllers')

.service('StationsSvc', function ($http) {
  this.fetchTopStations = function(attrs) {
    return $http.get('http://playola.fm/api/v1/stations/top_stations');
  };

  this.fetchAudioQueue = function(attrs) {
    return $http.get('http://playola.fm/api/v1/stations/get_audio_queue', {
      params : {
        stationId: attrs.stationId
      }
    });
  };

  this.fetchStation = function(attrs) {
    return $http.get('http://playola.fm/api/v1/stations/' + attrs.stationId);
  };

  this.getSpinByCurrentPosition = function(attrs) {
    return $http.get('http://playola.fm/api/v1/stations/get_spin_by_current_position',
                { params: attrs });
  };

  this.getCommercialBlockForBroadcast = function(attrs) {
    return $http.get('http://playola.fm/api/v1/stations/getCommercialBlockForBroadcast',
                { params: attrs });
  };
  
  this.updateAudioQueue = function(audioQueue) {
    $scope.audioQueue = audioQueue;
  };
})