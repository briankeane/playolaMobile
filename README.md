# playolaMobile

## To Install Locally

#### 1) Install [Ionic Framework](http:://ionicframework.com)
#### 2) Fork and Clone this repo
#### 3) Obtain a [developer account from Twitter](https://dev.twitter.com/) and set up a new application
#### 4) Create a file called 'www/js/secrets.js' with this information:
    angular.module('starter.controllers')
    .constant('myAppConfig', {
        oauthSettings: {
            consumerKey: 'xxxxxYOURCONSUMERKEYHERExxxxxxx',
            consumerSecret: 'xxxxxxxYOURCONSUMERSECRETHERExxxxxxxxxxx',
            requestTokenUrl: 'https://api.twitter.com/oauth/request_token',
            authorizationUrl: "https://api.twitter.com/oauth/authorize",
            accessTokenUrl: "https://api.twitter.com/oauth/access_token",
            callbackUrl: "http://localhost/callback"
        }
    });
