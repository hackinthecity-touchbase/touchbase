var express = require("express");
var http = require("http");
var app = express();

exports.app = app;

var port = process.env.PORT || 1201;
var server = http.createServer(app).listen(port, function () {
  console.log("Vera server started on port ", server.address().port, app.settings.env);
});

exports.server = server;
