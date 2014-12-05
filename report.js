var express = require('express')
var fs = require('fs')
var app = express()

app.get('/api/:min_date/:max_date', function (req, res) {
  var min_date = req.param('min_date'); // YYYMMDDHH
  var max_date = req.param('max_date'); // YYYMMDDHH

  console.log(min_date + "-" + max_date);

  var allFiles = fs.readdirSync(__dirname + "/files/").sort();
  console.log(allFiles);
  var files_to_use = [];
  var l = allFiles.length;

  // removes the .json from file name
  var allFilesName = allFiles.map(function(str) {
    return str.split(".")[0];
  });

  var response = "[";
  for (var i = 0; i < l; i++) {
  	if (allFilesName[i] >= min_date && allFilesName[i] <= max_date) {
      
      // concatenates ',' for next json
      if (response != "[") {
        response += ",";
      }

  		response += fs.readFileSync(__dirname + "/files/" + allFiles[i]) + "\n";
  	}
  };
  response += "]";

  res.send(response);

})

app.use(express.static(__dirname + '/public'));

var server = app.listen(3002);