(function() {
'use strict';

describe('ra.pageload', function() {
  beforeEach(function() {
    module('ra.pageload');
  });

  describe('loadingProgress', function() {
    var request,
        loadingProgress,
        $rootScope;

    beforeEach(inject(function($injector) {
      loadingProgress = $injector.get('loadingProgress');
      $rootScope = $injector.get('$rootScope');

      request = {
        method: 'GET',
        url: 'api/hello'
      };
    }));

    describe('#reset', function() {
      it('should reset pending requests', function() {
        loadingProgress.pendingRequests = [request];
        loadingProgress.loaded  = true;

        loadingProgress.reset();
        expect(loadingProgress.pendingRequests).not.toContain(request);
        expect(loadingProgress.loaded).toBeFalsy();
      });
    });

    describe('#queue', function() {
      beforeEach(function() {
        loadingProgress.pendingRequests = [];
      });

      it('should add request to pending requests', function() {
        loadingProgress.queue(request);

        expect(loadingProgress.pendingRequests).toContain(request.url);
      });

      it('should only add GET requests to pending requests', function() {
        request.method = 'POST';
        loadingProgress.queue(request);

        expect(loadingProgress.pendingRequests).not.toContain(request.url);
      });

      it('should not add if request is not specified', function() {
        loadingProgress.queue();

        expect(loadingProgress.pendingRequests.length).toEqual(0);
      });
    });

    describe('#dequeue', function() {
      beforeEach(function() {
        spyOn(loadingProgress, 'notify');
        loadingProgress.pendingRequests = [];
      });

      it('should remove request from pending requests', function() {
        loadingProgress.pendingRequests.push(request);
        loadingProgress.dequeue(request);

        expect(loadingProgress.pendingRequests).not.toContain(request.url);
      });

      it('should not do anything if request is not found in pending requests', function() {
        loadingProgress.pendingRequests.push(request);
        loadingProgress.dequeue('bye.html');

        expect(loadingProgress.pendingRequests.length).toEqual(1);
      });

      it('should notify child scopes if there are no more pending requests after a timeout', inject(function($timeout) {
        loadingProgress.dequeue();
        expect(loadingProgress.notify).not.toHaveBeenCalled();

        $timeout.flush();
        expect(loadingProgress.notify).toHaveBeenCalledWith('pageload:ready');
      }));

      it('should not notify more than once', inject(function($timeout) {
        loadingProgress.dequeue();
        loadingProgress.dequeue();
        $timeout.flush();

        expect(loadingProgress.notify.callCount).toEqual(1);
      }));
    });

    describe('#notify', function() {
      beforeEach(function() {
        spyOn($rootScope, '$broadcast');
      });

      it('should broadcast event', function() {
        loadingProgress.notify('event');

        expect($rootScope.$broadcast).toHaveBeenCalledWith('event');
      });
    });
  });

  describe('loadingInterceptor', function() {
    var request,
        response,
        output,
        loadingInterceptor,
        loadingProgress;

    beforeEach(inject(function($injector) {
      loadingInterceptor = $injector.get('loadingInterceptor');
      loadingProgress = $injector.get('loadingProgress');

      request = {
        method: 'GET',
        url: 'api/hello'
      };

      response = {
        config: request,
        data: '{ "message": "Hello world" }'
      };
    }));

    describe('#request', function() {
      beforeEach(function() {
        spyOn(loadingProgress, 'init');
        spyOn(loadingProgress, 'queue');
      });

      it('should lazy init loadingProgress service', function() {
        loadingInterceptor.request(request);
        expect(loadingProgress.init).toHaveBeenCalled();
        loadingProgress.initialized = true;

        loadingInterceptor.request(request);
        expect(loadingProgress.init.callCount).toEqual(1);
      });

      it('should queue a request', function() {
        loadingInterceptor.request(request);
        expect(loadingProgress.queue).toHaveBeenCalledWith(request);
      });

      it('should return the request', function() {
        output = loadingInterceptor.request(request);
        expect(output).toEqual(request);
      });
    });

    describe('#response', function() {
      beforeEach(function() {
        spyOn(loadingProgress, 'dequeue');
      });

      it('should dequeue a request', function() {
        loadingInterceptor.response(response);
        expect(loadingProgress.dequeue).toHaveBeenCalledWith(response.config);
      });

      it('should return the response', function() {
        output = loadingInterceptor.response(response);
        expect(output).toEqual(response);
      });
    });

    describe('#requestError', function() {
      beforeEach(function() {
        spyOn(loadingProgress, 'dequeue');
      });

      it('should dequeue a request', function() {
        loadingInterceptor.requestError(response);
        expect(loadingProgress.dequeue).toHaveBeenCalledWith(response.config);
      });

      it('should reject the response', inject(function($q) {
        output = loadingInterceptor.requestError(response);
        expect(output).toEqual($q.reject(response));
      }));
    });

    describe('#responseError', function() {
      beforeEach(function() {
        spyOn(loadingProgress, 'dequeue');
      });

      it('should dequeue a request', function() {
        loadingInterceptor.responseError(response);
        expect(loadingProgress.dequeue).toHaveBeenCalledWith(response.config);
      });

      it('should reject the response', inject(function($q) {
        output = loadingInterceptor.responseError(response);
        expect(output).toEqual($q.reject(response));
      }));
    });
  });
});

})();
