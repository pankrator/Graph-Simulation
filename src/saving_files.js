var express = require('express');
var app = express.createServer();

app.configure(function(){
  app.use(express.bodyParser());
});

app.post('/save', function(req, res){
  console.log(req.body);
  res.send("ok");
});

app.listen(8080);
console.log('listening to http://localhost:8080');