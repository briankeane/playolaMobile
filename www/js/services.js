/*
 * This code is based on:
 *    https://github.com/ccoenraets/sociogram-angular-ionic
 *
 *  and heavily based on Aaron Saunders Twitter Stuff here:
 *  http://www.clearlyinnovative.com/blog/post/34758525539/ionic-framework-angularjs-working-twitter-jsoauth
 *
 *  -- Brian Keane, Jan 2014
 */

 angular.module('twitterLib', [])

  .factory('TwitterLib', function ($rootScope, $q, $window, $http, myAppConfig) {
    var runningInCordova = false;
    var loginWindow;

    var index = document.location.href.indexOf('index.html');
    var callbackURL = document.location.href.substring(0, index) + 'oauthcallback.html';
    var oauth;
    var options;

    options = angular.extend({}, myAppConfig.oauthSettings);
    options = angular.extend(options, {
      callbackUrl: callbackURL
    });

    var twitterKey = "PLAYOLA.KEY";

    $window.document.addEventListener("deviceready", function() {
      runningInCordova = true;
      callbackURL = myAppConfig.oauthSettings.callbackUrl;
      options.callbackUrl = callbackURL;
    }, false);

    function byteArrayToString(byteArray) {
      var string = '';
      for (var i=0; i<byteArray.length; i++) {
        string = string + String.fromCharCode(byteArraye[i]);
      }
      return string;
    }

    var Twitter = {
      init: function() {
        var deferredLogin = $q.defer();

        var doLoadstart = function(event) {
          var url = event.url;
          Twitter.inAppBrowserLoadHandler(url, deferredLogin);
        };

        var doExit = function (event) {
          deferredLogin.reject({error: 'user_cancelled',
            error_description: 'User cancelled login process',
            error_reason: "user_cancelled" 
          });
        };

        var openAuthoriseWindow = function (url) {
          loginWindow = $window.open(url, '_blank', 'location=no');

          if (runningInCordova) {
            loginWindow.addEventListener('loadstart', doLoadstart);
          }
          else
          {
            window.deferredLogin = deferredLogin;
          }
        };

        var failureHandler = function() {
          console.log('ERROR: ' + JSON.stringify(error));
          deferredLogin.reject({error: 'user_cancelled', error_description: error });
        };

        var storedAccessData, rawData = localStorage.getItem(twitterKey);
        
        if (localStorage.getItem(twitterKey) != null) {
          Twitter.verify(deferredLogin);
        }
        else
        {
          oauth = OAuth(options);
          oauth.fetchRequestToken(openAuthoriseWindow, failureHandler);
        }

        return deferredLogin.promise;
      },

      inAppBrowserLoadHandler: function(_url, _deferred) {
        _deferred = _deferred || window.deferredLogin;

        var successHandler = function (args) {
          var accessData = {};
          accessData.accessTokenKey = oauth.getAccessToken()[0];
          accessData.accessTokenSecret = oauth.getAccessToken()[1];

          $window.localStorage.setItem(twitterKey, JSON.stringify(accessData));

          Twitter.verify(_deferred);
        };

        var failureHandler = function (_args) {
          _deferred.reject({ error: 'user_cancelled', error_description: _args });
        };

        if (_url.indexOf(callbackURL + "?") >= 0) {
          loginWindow.close();

          var params;
          var verifier = '';

          params = _url.substr(_url.indexOf('?') + 1);

          params = params.split('&');
          for (var i=0; i<params.length; i++) {
            var y = params[i].split('=');
            if (y[0] === 'oauth_verifier') {
              verifier = y[1];
            }
          }
          oauth.setVerifier(verifier);
          oauth.fetchAccessToken(successHandler, failureHandler);
        }
      },

      verify: function(_deferred) {
        var deferred = _deferred || $q.defer();
        var storedAccessData
        var rawData = localStorage.getItem(twitterKey);
        var storedAccessData = JSON.parse(rawData);

        oauth = oauth || OAuth(options);

        oauth.setAccessToken([storedAccessData.accessTokenKey, storedAccessData.accessTokenSecret]);

        oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true', function (data) {
          deferred.resolve(JSON.parse(data.text));
        }, function (_error) {
          deferred.reject(JSON.parse(_error));
        });
        return deferred.promise;
      },

      apiGetCall: function (_options) {
        var deferred = $q.defer();

        // javascript OAuth will care of else for app we need to send only the options
        oauth = oauth || OAuth(options);

        var _reqOptions = angular.extend({}, _options);
        _reqOptions = angular.extend(_reqOptions, {
            success: function (data) {
                deferred.resolve(JSON.parse(data.text));
            },
            failure: function (error) {
                deferred.reject(JSON.parse(error.text));
            }
        });

        oauth.request(_reqOptions);
        return deferred.promise;
      },

      apiPostCall: function (_options) {
        var deferred = $q.defer();

        oauth = oauth || OAuth(options);

        oauth.post(_options.url, _options.params,
          function (data) {
            deferred.resolve(JSON.parse(data.text));
          }, function (error) {
            console.log("in apiPostCall reject " + error.text);
            deferred.reject(JSON.parse(error.text));
          }
        );
        return deferred.promise;
      },
      
      logOut: function () {
        window.localStorage.removeItem(twitterKey);
        options.accessTokenKey = null;
        options.accessTokenSecret = null;
        console.log("Please authenticate to use this app");
      }
    };
    return Twitter;
  })
;

function oauthCallback(url) {
    var injector = angular.element(document.getElementById('main')).injector();
    injector.invoke(function (TwitterLib) {
        TwitterLib.inAppBrowserLoadHandler(url, false);
    });
}