var touchbase = angular.module('touchbase', []);

touchbase.factory('Room', function(){

  var Model = function(obj) {
    this._id = obj._id;
    // ...
  }
  
  Model.prototype.remove = function() {
    $http.delete("/rooms/"+this._id)
      .success(function(data) {
        console.log("Room" + this._id + " updated");
      })
      .error(function(data) {
        console.log("Room" + this._id + " failed to remove");        
      }) 
  }
  
  Model.prototype.save = function() {
    $http.put("/rooms", this)
      .success(function(data) {
        console.log("Room" + this._id + " updated");
      })
      .error(function(data) {
        console.log("Room" + this._id + " failed to update");        
      }) 
  }
  
  return {
  
    get: function(id) {
      $http.get("/rooms/"+id)
        .success(function(data) {
          return new Model(data);
        })
        .error(function(data) {
          console.log("Room" + id + " failed to get");        
        }) 
    },
    create: function(obj) {
      var newModel = new Model(obj);
      return newModel.save();
    }
  }

})