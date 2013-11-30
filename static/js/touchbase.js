var touchbase = angular.module('touchbase', []);

touchbase.factory('Room', function(){

  var Model = function(obj) {
    this._id = obj._id;
    // ...
  }
  
  Model.prototype.remove = function() {
    $http.delete("/rooms/"+this._id, this)
      .success(function(data) {
        console.log("Room" + this._id + " updated");
      })
      .error(function(data) {
        console.log("Room" + this._id + " failed to update");        
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
  
})