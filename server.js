var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json({type: "text/json"}));
// app.use(bodyParser.urlencoded());
app.use(express.static(__dirname));

var savedGraphs = {};

app.post('/save', function(req, res) {
	// console.log(req.body.graph);

	savedGraphs[req.body.name] = {
		graph: req.body.graph,
		edges: req.body.edgeCounter,
		nodes: req.body.nodeCounter
	};
	res.send("ok");
});

app.get('/load', function(req, res) {
	console.log(savedGraphs[req.query.name]);

	res.send(savedGraphs[req.query.name]);
});

app.listen(8080);
console.log('listening to http://localhost:8080');