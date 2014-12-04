var express = require('express')
var fs = require('fs')
var app = express()

app.get('/', function (req, res) {
  var min_date = req.param('min_date'); // YYYMMDDHH
  var max_date = req.param('max_date'); // YYYMMDDHH

  var allfiles = fs.readdirSync(__dirname + "/files/").sort();
  var files_to_use = [];
  var l = allfiles.length;
  var response = "";
  for (var i = 0; i < l; i++) {
  	if (allfiles[i] >= min_date && allfiles[i] <= max_date) {
  		response += fs.readFileSync(__dirname + "/files/" + allfiles[i]) + "\n";
  	}
  };


})