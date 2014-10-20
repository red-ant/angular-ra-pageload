/*!
 * angular-ra-pageload-event.js v0.0.1
 * 
 * Copyright 2014
 * MIT License
 */
(function() {

'use strict';

angular.module('ra.pageLoad', [])

  .config(function($httpProvider) {
    // Register a http interceptor
    $httpProvider.interceptors.push('loadingInterceptor');
  })

  .run(function($rootScope, loadingProgress) {
    // Init loadingProgress service
    loadingProgress.init();

    // Reset loading queue on route change
    $rootScope.$on('$routeChangeSuccess', loadingProgress.reset);
    $rootScope.$on('$routeUpdate', loadingProgress.reset);
  })

  .factory('loadingInterceptor', function($q, loadingProgress) {
    var pendingRequests = [];

    function onRequest(request) {
      loadingProgress.queue(request);
      
      return request;
    }

    function onResponse(response) {
      loadingProgress.dequeue(response.config);
      
      return response;
    }

    function onError(response) {
      loadingProgress.dequeue(response.config);

      return $q.reject(response);
    }

    return {
      request: onRequest,
      response: onResponse,
      requestError: onError,
      responseError: onError
    };
  })

  .factory('loadingProgress', function($rootScope, $timeout) {
    return {
      init: function() {
        this.pendingRequests = [];
      },

      reset: function() {
        this.pendingRequests.length = 0;
        this.loaded = false;
      },

      queue: function(request) {
        // Add to queue if it is a GET request
        if (request.method === 'GET') {
          this.pendingRequests.push(request.url);
          this.loaded = false;
        }
      },

      dequeue: function(request) {
        var index = this.pendingRequests.indexOf(request.url);

        // Remove from queue
        if (index !== -1) {
          this.pendingRequests.splice(index, 1);
        }

        // Wait for the next digest cycle
        $timeout(function() {
          // If there are no pending requests, notify child scopes
          if (this.pendingRequests.length === 0) {
            this.notify('pageReady');
            this.loaded = true;
          }
        }.bind(this));
      },

      notify: function() {
        $rootScope.$broadcast.apply($rootScope, arguments);
      }
    };
  });

})();
