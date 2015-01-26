angular.module('starter.controllers', ['twitterLib'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, TwitterLib) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    TwitterLib.init().then(function(_data) {
      alert(JSON.stringify(_data));
    }, function error(_error) {
      alert(JSON.stringify(_error));
    });
  };

  $scope.logout = function() {
    TwitterLib.logout();
  }

  //$scope.login();

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('TopStationsCtrl', function ($scope, StationsSvc) {
  $scope.topStations = [];
  StationsSvc.fetchTopStations().success(function (stations) {
    for (var i=0; i<10; i++) {
      $scope.topStations.push(stations[i]);
    }
  });
})

.controller('StationCtrl', function ($scope, $stateParams, StationsSvc, StationPlayer) {
  $scope.listenStationId = parseInt($stateParams.stationId);
  StationsSvc.fetchAudioQueue({ stationId: $stateParams.stationId })
  .success(function (data) {
    $scope.audioQueue = data;
    alert('fetchAudioQueue Success');
    StationPlayer.restart({ listenStationId: $scope.listenStationId,
                                 audioQueue: $scope.audioQueue });
  });

  console.log($scope);
  // $scope.topStations.forEach(function (station) {
  //   if (station.id === $stateParams.stationId) {
  //     $scope.listenStation = station;
  //   }
  // })
})

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
  this.downloadSong = function(spin, callback) {
    // check to see if it's already there
    alert('download Song started');
    
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory + spin.filename,
      callback(spin),   // if it's already there, continue with callback
      goGetFile(spin, callback)   // otherwise download the file
    );

    function goGetFile(spin, callback) {
      var fileTransfer = new FileTransfer();
      var downloadPath = cordova.file.dataDirectory + spin.filename;

      fileTransfer.download(
        spin.key,
        downloadPath,
        function(entry) {
          callback(entry);
        },
        function(error) {
          alert('download error:' + error.code + '\n' + spin.key);
          alert('filename: "' + spin.filename + '"');
          console.dir(error);
          alert(error);
        },
        true,
        {}
      );
    }
  }
})

