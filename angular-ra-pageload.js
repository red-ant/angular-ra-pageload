/*!
 * angular-ra-pageload.js v0.0.3
 * 
 * Copyright 2014
 * MIT License
 */
(function() {

'use strict';

/**
 * @ngdoc overview
 * @name ra.pageload
 *
 * @description
 * A module for monitoring initial http GET requests per route change
 *
 * @example
 * To use, include `ra.pageload` as a dependency.
 * <pre>
 * angular.module('application', ['ra.pageload'])
 * </pre>
 *
 * And then add the following config
 *
 * <pre>
 * angular.module('application')
 *   .config(function($httpProvider) {
 *     $httpProvider.interceptors.push('loadingInterceptor');
 *   });
 * </pre>
 */
angular.module('ra.pageload', [])
  /**
   * @ngdoc object
   * @name ra.pageload.loadingInterceptor
   *
   * @requires $q
   * @requires $loadingProgress
   *
   * @description
   * A `httpInterceptor` that adds GET requests to a queue and removes them once they are done.
   */
  .factory('loadingInterceptor', function($q, loadingProgress) {
    var loadingInterceptor = {
      /**
       * @ngdoc method
       * @name request
       * @methodOf ra.pageload.loadingInterceptor
       *
       * @description
       * Adds a new http request to the loading queue.
       *
       * @param {Object} request http config object
       * @return {Object} http config object
       */
      request: function(request) {
        if (!loadingProgress.initialized) {
          loadingProgress.init();
        }

        loadingProgress.queue(request);
        
        return request;
      },

      /**
       * @ngdoc method
       * @name response
       * @methodOf ra.pageload.loadingInterceptor
       *
       * @description
       * Removes a completed http request from the loading queue
       *
       * @param {Object} request http response object
       * @return {Object} http response object
       */
      response: function(response) {
        loadingProgress.dequeue(response.config);
        
        return response;
      },

      /**
       * @ngdoc method
       * @name requestError
       * @methodOf ra.pageload.loadingInterceptor
       *
       * @description
       * Removes an unsuccessful http request from the loading queue
       *
       * @param {Object} request http response object
       * @return {Object} rejected http promise
       */
      requestError: function(response) {
        return loadingInterceptor.responseError(response);
      },

      /**
       * @ngdoc method
       * @name responseError
       * @methodOf ra.pageload.loadingInterceptor
       *
       * @description
       * Removes an unsuccessful http response from the loading queue
       *
       * @param {Object} request http response object
       * @return {Object} rejected http promise
       */
      responseError: function(response) {
        loadingProgress.dequeue(response.config);

        return $q.reject(response);
      }
    };

    return loadingInterceptor;
  })

  /**
   * @ngdoc object
   * @name ra.pageload.loadingProgress
   *
   * @requires $rootScope
   * @requires $timeout
   *
   * @description
   * Monitors the loading progress of http GET requests
   */
  .factory('loadingProgress', function($rootScope, $timeout) {
    var loadingProgress = {
      /**
       * @ngdoc method
       * @name init
       * @methodOf ra.pageload.loadingProgress
       
       * @description
       * Initialises the service
       
       * @return {Object} self
       */
      init: function() {
        this.pendingRequests = [];
        this.ready = false;
        this.initialized = true;

        // Reset loading queue on route change
        $rootScope.$on('$routeChangeSuccess', this.reset.bind(this));
        $rootScope.$on('$routeUpdate', this.reset.bind(this));

        return this;
      },

      /**
       * @ngdoc method
       * @name reset
       * @methodOf ra.pageload.loadingProgress
       
       * @description
       * Resets the queue of pending http requests
       
       * @return {Object} self
       */
      reset: function() {
        this.pendingRequests.length = 0;
        this.ready = false;

        return this;
      },

      /**
       * @ngdoc method
       * @name queue
       * @methodOf ra.pageload.loadingProgress
       
       * @description
       * Adds a http request to the queue of pending requests
       
       * @param {Object} request The http request to be added
       * @return {Object} self
       */
      queue: function(request) {
        // Add to queue if it is a GET request
        if (request && request.method === 'GET') {
          this.pendingRequests.push(request.url);
          this.ready = false;
        }

        return this;
      },

      /**
       * @ngdoc method
       * @name dequeue
       * @methodOf ra.pageload.loadingProgress
       
       * @description
       * Removes a http request from the queue.
       * If the queue is empty, it fires `pageload:ready` event to notify child scopes that all pending requests are completed.
       
       * @param {Object} request The http request to be removed
       * @return {Object} self
       */
      dequeue: function(request) {
        var index = this.pendingRequests.indexOf(request && request.url);

        // Remove from queue
        if (index !== -1) {
          this.pendingRequests.splice(index, 1);
        }

        // Wait for the next digest cycle
        $timeout(function() {
          // If there are no pending requests, notify child scopes
          if (this.pendingRequests.length === 0 && !this.ready) {
            this.notify('pageload:ready');
            this.ready = true;
          }
        }.bind(this));

        return this;
      },

      /**
       * @ngdoc method
       * @name notify
       * @methodOf ra.pageload.loadingProgress
       
       * @description
       * Broadcasts an event to child scopes
       
       * @param {string} name Event name to broadcast
       * @param {...*} args Optional one or more arguments which will be passed onto the event listeners.
       * @return {Object} Event object
       */
      notify: function() {
        return $rootScope.$broadcast.apply($rootScope, arguments);
      }
    };

    return loadingProgress;
  });

})();
