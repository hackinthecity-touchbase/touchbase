var touchbase = angular.module('touchbase', ['ngRoute']);

touchbase.config(function($routeProvider) {
  $routeProvider
    .when('/', { templateUrl: '/views/home.html', controller:"RoomsContoller" })
    .when('/me', { templateUrl: '/views/me.html', controller:"MeController" })
    .when('/rooms/:roomId', { templateUrl: '/views/room.html', controller:"RoomController" });
});

touchbase.controller('RoomsContoller', function(Room, $scope) {

  Room.query(function(rooms) {
    $scope.rooms = rooms;
  });

});


touchbase.controller('RoomController', function($routeParams, $scope, Room, Socket,$location,$window, WebRTC, Me) {
  $scope.messages = [];
  Me.user.success(function(me){
    $scope.me = me;
  })

  var roomId = $routeParams.roomId;
  Room.get(roomId, function(room) {
    $scope.room = room;
    Socket.emit('subscribe', {room: room._id});

    room.messages(function(messages) {
      $scope.messages = messages;
    }, function(err) {
      console.log(err);
    });
        

  }, function(err) {
    alert("BUUUUUU");
  });

  $scope.sendMessage = function(message) {
	  
    Socket.emit('chat_send', {message: message});
	$scope.message = "";
  };

  Socket.on('add_member', function (data) {
    $scope.room.members.forEach(function (member) {
      if (member._id == data._id) {
        member.active = true;
      }
    });
  });

  Socket.on('chat_receive', function (data) {
    $scope.messages.push(data);
  });
});


touchbase.run(function($rootScope, $location, $routeParams) {
  $rootScope.$on('$routeChangeSuccess', function(newRoute, oldRoute) {
  });
});

touchbase.factory('WebRTC', function() {
  this.onMessage = function() {
    
  }
})



touchbase.controller('NewMemberController', function($scope, Room){
  $scope.newMember = {};
  $scope.addMember = function(newMember){
    $scope.room.addMember(newMember, function(){}, function(err){ alert("BUUUUUU"); });
	$scope.newMember = {};
  }
  
})

touchbase.controller('NewRoomController', function($scope, $location, Room) {
  $scope.newRoom = {}

  $scope.create = function(newRoom){
    Room.create(newRoom, function(room){
      $location.path("/rooms/"+room._id);
    }, function(err){
      alert("BUUU");
    });
  };

});

touchbase.service('Me', function($http) {
  this.user = $http.get('/me');
})

touchbase.factory('Room', function($http){

  var Model = function(obj) {
    if (obj._id) this._id = obj._id;
    this.name = obj.name;
    this.members = obj.members || [];
  };

  Model.prototype.remove = function(success, fail) {
    return $http.delete("/rooms/"+this._id)
      .success(function(data) { success(data); })
      .error(function(data) { fail(data); });
  };

  Model.prototype.save = function(success, fail) {
    return $http.put("/rooms", this)
      .success(function(data) { success(data); })
      .error(function(data) { fail(data); });
  };

  Model.prototype.messages = function(success, fail) {
    $http.get("/rooms/"+this._id+"/messages")
      .success(function(data) { success(data); })
      .error(function(data) { fail(data); });
  };

  Model.prototype.addMember = function(newMember, success, fail){
    var model = this;
    return $http.post("/rooms/" + model._id + "/members" , newMember)
      .success(function(data) {
        model.members.push(data);
        success(data);
      })
      .error(function(data) { fail(data) })
  }

  return {
    get: function(id, success, fail) {
      return $http.get("/rooms/"+id)
        .success(function(data) { success(new Model(data)); })
        .error(function(data) { fail(data); });
    },
    query: function(success, fail) {
      return $http.get("/rooms")
        .success(function(data) {
          success(data.map(function(single) { return new Model(single); }));
        })
        .error(function(data) { fail(data); });

    },
    create: function(obj, success, fail) {
      var newModel = new Model(obj);
      return $http.post("/rooms", newModel)
        .success(function(data) { success(data); })
        .error(function(data) { fail(data); });
    }
  };
});

touchbase.controller('MeController', function() {
  
})

touchbase.directive('videoConference', function() {
  return {
    scope: {
      sender: "@user",
    },
    template: '<div> \
              <table style="width: 100%;" id="rooms-list"></table> \
              <div id="videos-container"></div></div>',
    replace: true,
    link: function (scope, elem, attrs) {
      
      scope.$watch('sender', function(user){
        scope.sender = user;
        config.sender = user;
      });
      
      var roomExists = false;
      var config = {
          sender: scope.sender,
          openSocket: function(config) {
              var SIGNALING_SERVER = 'http://webrtc-signaling.jit.su:80/',
                  defaultChannel =  "SAMEROOM" || location.hash.substr(1) || 'video-conferencing-hangout';

              var channel = config.channel || defaultChannel;
              var sender = scope.sender;

              io.connect(SIGNALING_SERVER).emit('new-channel', {
                  channel: channel,
                  sender: sender
              });

              var socket = io.connect(SIGNALING_SERVER + channel);
              socket.channel = channel;
              socket.on('connect', function() {
                  if (config.callback) config.callback(socket);
              });

              socket.send = function(message) {
                  socket.emit('message', {
                      sender: sender,
                      data: message
                  });
              };

              socket.on('message', config.onmessage);
          },
          onRemoteStream: function(media) {
              var video = media.video;
              console.log("MEDIA", media.stream.sender)
              video.setAttribute('controls', true);
              video.setAttribute('id', media.stream.id);
              video.setAttribute('data-user', media.stream.sender);
              videosContainer.insertBefore(video, videosContainer.firstChild);
              video.play();
          },
          onRemoteStreamEnded: function(stream) {
              var video = document.getElementById(stream.id);
              if (video) video.parentNode.removeChild(video);
          },
          onRoomFound: function(room) {
                          roomExists = true;
              var alreadyExist = document.querySelector('button[data-broadcaster="' + room.broadcaster + '"]');
              if (roomExists) return;
          }
      };

      var conferenceUI = conference(config);
      var videosContainer = document.getElementById('videos-container') || document.body;
      var roomsList = document.getElementById('rooms-list');

      setTimeout(function() {
          captureUserMedia(function () {
            
            if (!roomExists) {
              conferenceUI.createRoom({
                  roomName: 'Anonymous'
              });
            } else {
              var broadcaster = room.broadcaster;
              var roomToken = room.broadcaster;
              captureUserMedia(function() {
                  conferenceUI.joinRoom({
                      roomToken: roomToken,
                      joinUser: broadcaster,
                      username: scope.sender
                  });
              });
            }
            })
          }, 5000);

      function captureUserMedia(callback) {
          var video = document.createElement('video');
          video.setAttribute('autoplay', true);
          video.setAttribute('controls', true);
          videosContainer.insertBefore(video, videosContainer.firstChild);

          getUserMedia({
              video: video,
              onsuccess: function (stream) {
                  config.attachStream = stream;
                  video.setAttribute('muted', true);
                  callback();
              }
          });
      }
      
    }
  };
})

touchbase.factory('Socket', function ($rootScope) {
  var socket = io.connect('/');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});

touchbase.directive('ngEnter', function () {
  return function (scope, elm, attrs) {
    elm.bind('keypress', function (e) {
      var intKey = (window.Event) ? e.which : e.keyCode;
      if (intKey === 13) {
        scope.$apply(attrs.ngEnter);
      }
    });
  };
});

window.setInterval(function() {
  var elem = document.getElementById('chat_messages');
  elem.scrollTop = elem.scrollHeight;
}, 500);
