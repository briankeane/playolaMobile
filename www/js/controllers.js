angular.module('starter.controllers', ['twitterLib', 'ngCordova'])

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

.controller('TopStationsCtrl', function ($scope, StationsSvc, $rootScope) {
  $scope.topStations = [];
  StationsSvc.fetchTopStations().success(function (stations) {
    for (var i=0; i<10; i++) {
      $scope.topStations.push(stations[i]);
    }
  });
  $scope.changeListenStation = function(station) {
    $rootScope.listenStation = station;
  };
})

.controller('StationCtrl', function ($scope, $stateParams, StationsSvc, StationPlayer, $rootScope) {
  $scope.$on('audioQueueUpdated', function (event) {
    if (!$scope.$$phase) {
      $scope.$apply();
    }
  });


  $rootScope.listenStationId = parseInt($stateParams.stationId);
  StationsSvc.fetchStation({ stationId: $rootScope.listenStationId })
  .success(function (data) {
    $scope.listenStation = data;
    if (!$scope.$$phase) {
      $scope.$apply();
    }
  });
  StationsSvc.fetchAudioQueue({ stationId: $stateParams.stationId })
  .success(function (data) {
    StationPlayer.initialize({ listenStationId: $scope.listenStationId,
                                 audioQueue: data });
  });
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
  this.getCommercialBlockForBroadcast = function(attrs) {
    return $http.get('http://playola.fm/api/v1/stations/getCommercialBlockForBroadcast',
                { params: attrs });
  };
  this.updateAudioQueue = function(audioQueue) {
    $scope.audioQueue = audioQueue;
  };
})

