(function() {
'use strict';

describe('ra.pageload', function() {
  beforeEach(function() {
    module('ra.pageload');
  });

  describe('raLoadingProgress', function() {
    var request,
        raLoadingProgress,
        $rootScope;

    beforeEach(inject(function($injector) {
      raLoadingProgress = $injector.get('raLoadingProgress');
      $rootScope = $injector.get('$rootScope');

      request = {
        method: 'GET',
        url: 'api/hello'
      };
    }));

    describe('#reset', function() {
      it('should reset pending requests', function() {
        raLoadingProgress.pendingRequests = [request];
        raLoadingProgress.ready  = true;

        raLoadingProgress.reset();
        expect(raLoadingProgress.pendingRequests).not.toContain(request);
        expect(raLoadingProgress.ready).toBeFalsy();
      });
    });

    describe('#queue', function() {
      beforeEach(function() {
        raLoadingProgress.pendingRequests = [];
      });

      it('should add request to pending requests', function() {
        raLoadingProgress.queue(request);

        expect(raLoadingProgress.pendingRequests).toContain(request.url);
      });

      it('should only add GET requests to pending requests', function() {
        request.method = 'POST';
        raLoadingProgress.queue(request);

        expect(raLoadingProgress.pendingRequests).not.toContain(request.url);
      });

      it('should not add if request is not specified', function() {
        raLoadingProgress.queue();

        expect(raLoadingProgress.pendingRequests.length).toEqual(0);
      });
    });

    describe('#dequeue', function() {
      beforeEach(function() {
        spyOn(raLoadingProgress, 'notify');
        raLoadingProgress.pendingRequests = [];
      });

      it('should remove request from pending requests', function() {
        raLoadingProgress.pendingRequests.push(request);
        raLoadingProgress.dequeue(request);

        expect(raLoadingProgress.pendingRequests).not.toContain(request.url);
      });

      it('should not do anything if request is not found in pending requests', function() {
        raLoadingProgress.pendingRequests.push(request);
        raLoadingProgress.dequeue('bye.html');

        expect(raLoadingProgress.pendingRequests.length).toEqual(1);
      });

      it('should notify child scopes if there are no more pending requests after a timeout', inject(function($timeout) {
        raLoadingProgress.dequeue();
        expect(raLoadingProgress.notify).not.toHaveBeenCalled();

        $timeout.flush();
        expect(raLoadingProgress.notify).toHaveBeenCalledWith('pageload:ready');
      }));

      it('should not notify more than once', inject(function($timeout) {
        raLoadingProgress.dequeue();
        raLoadingProgress.dequeue();
        $timeout.flush();

        expect(raLoadingProgress.notify.callCount).toEqual(1);
      }));
    });

    describe('#notify', function() {
      beforeEach(function() {
        spyOn($rootScope, '$broadcast');
      });

      it('should broadcast event', function() {
        raLoadingProgress.notify('event');

        expect($rootScope.$broadcast).toHaveBeenCalledWith('event');
      });
    });
  });

  describe('raLoadingInterceptor', function() {
    var request,
        response,
        output,
        raLoadingInterceptor,
        raLoadingProgress;

    beforeEach(inject(function($injector) {
      raLoadingInterceptor = $injector.get('raLoadingInterceptor');
      raLoadingProgress = $injector.get('raLoadingProgress');

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
        spyOn(raLoadingProgress, 'init');
        spyOn(raLoadingProgress, 'queue');
      });

      it('should lazy init raLoadingProgress service', function() {
        raLoadingInterceptor.request(request);
        expect(raLoadingProgress.init).toHaveBeenCalled();
        raLoadingProgress.initialized = true;

        raLoadingInterceptor.request(request);
        expect(raLoadingProgress.init.callCount).toEqual(1);
      });

      it('should queue a request', function() {
        raLoadingInterceptor.request(request);
        expect(raLoadingProgress.queue).toHaveBeenCalledWith(request);
      });

      it('should return the request', function() {
        output = raLoadingInterceptor.request(request);
        expect(output).toEqual(request);
      });
    });

    describe('#response', function() {
      beforeEach(function() {
        spyOn(raLoadingProgress, 'dequeue');
      });

      it('should dequeue a request', function() {
        raLoadingInterceptor.response(response);
        expect(raLoadingProgress.dequeue).toHaveBeenCalledWith(response.config);
      });

      it('should return the response', function() {
        output = raLoadingInterceptor.response(response);
        expect(output).toEqual(response);
      });
    });

    describe('#requestError', function() {
      beforeEach(function() {
        spyOn(raLoadingProgress, 'dequeue');
      });

      it('should dequeue a request', function() {
        raLoadingInterceptor.requestError(response);
        expect(raLoadingProgress.dequeue).toHaveBeenCalledWith(response.config);
      });

      it('should reject the response', inject(function($q) {
        output = raLoadingInterceptor.requestError(response);
        expect(output).toEqual($q.reject(response));
      }));
    });

    describe('#responseError', function() {
      beforeEach(function() {
        spyOn(raLoadingProgress, 'dequeue');
      });

      it('should dequeue a request', function() {
        raLoadingInterceptor.responseError(response);
        expect(raLoadingProgress.dequeue).toHaveBeenCalledWith(response.config);
      });

      it('should reject the response', inject(function($q) {
        output = raLoadingInterceptor.responseError(response);
        expect(output).toEqual($q.reject(response));
      }));
    });
  });
});

})();
