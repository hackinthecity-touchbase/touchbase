var touchbase = angular.module('touchbase', ['ngRoute']);

touchbase.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: '/views/home.html'
    })
    .when('/rooms/:roomId', {
      templateUrl: '/views/room.html'
    })
});

touchbase.controller('HomeController', function() {
  
})

touchbase.controller('RoomController', function($routeParams, $scope, Room) {
  var roomId = $routeParams.roomId;

  Room.get(roomId, function(room) {
    $scope.room = room;
  }, function(err) {
    console.log(err)
    alert("BUUUUUU");
  });
  
});

touchbase.factory('Room', function($http){

  var Model = function(obj) {
    this._id = obj._id;
    this.name = obj.name;
    // ...
  };
  
  Model.prototype.remove = function(success, fail) {
    return $http.delete("/rooms/"+this._id)
      .success(function(data) {
        success(data);
      })
      .error(function(data) {
        fail(data)
      });
  };
  
  Model.prototype.save = function(success, fail) {
    return $http.put("/rooms", this)
      .success(function(data) {
        success(data);
      })
      .error(function(data) {
        fail(data)
      });
  };
  
  return {
  
    get: function(id, success, fail) {
      
      return $http.get("/rooms/"+id)
        .success(function(data) { success(new Model(data)); })
        .error(function(data) { fail(data) });

    },
    create: function(obj, success, fail) {
      var newModel = new Model(obj);
      return newModel.save(success, fail);
    }
  }

})