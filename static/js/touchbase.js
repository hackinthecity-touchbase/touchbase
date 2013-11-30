var touchbase = angular.module('touchbase', ['ngRoute']);

touchbase.config(function($routeProvider) {
  $routeProvider
    .when('/', { templateUrl: '/views/home.html', controller:"RoomsContoller" })
    .when('/rooms/:roomId', { templateUrl: '/views/room.html', controller:"RoomController" });
});

touchbase.controller('RoomsContoller', function(Room, $scope) {

  Room.query(function(rooms) {
    $scope.rooms = rooms;
  });

});

touchbase.controller('RoomController', function($routeParams, $scope, Room, Socket) {
  $scope.messages = [];

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

touchbase.controller('NewMemberController', function($scope, Room){
  $scope.newMember = {};
  $scope.addMember = function(newMember){

    $scope.room.addMember(newMember, function(){}, function(err){ alert("BUUUUUU"); });
  }
  $scope.newMember = {};
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