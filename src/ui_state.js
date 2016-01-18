var selectionState = {};
selectionState.firstNode = null;
selectionState.iterator = null;
selectionState.tool = "HAND";

var HandTool = function () {}

HandTool.prototype.mouseDown = function (event) {
	if (event.button == 0) {
		this.nodeId = forceController.getNodeIdByCoordinates(input.mouse.x,
														 input.mouse.y);
		if (this.nodeId != null) {
			
		}
	}
}

var tools = {
	"HAND": {
		mouseDown: function (event) {
		}
	}
}

var leftPanel = new ButtonGroup();

var attachUIListeners = function () {
	var handButton = leftPanel.addButton(document.getElementById("hand_icon"));
	var lineButton = leftPanel.addButton(document.getElementById("line"));

	leftPanel.select(handButton);

	leftPanel.addListener(handButton, function (selectionState) {
		if (selectionState.iterator) {
			selectionState.iterator.reset();
			selectionState.iterator = null;
		}
		selectionState.tool = "HAND";
	}.bind(undefined, selectionState));

	leftPanel.addListener(lineButton, function (selectionState) {
		if (selectionState.iterator) {
			selectionState.iterator.reset();
			selectionState.iterator = null;
		}
		selectionState.tool = "LINE";
	}.bind(undefined, selectionState));
	
	var BFSIteratorButton = document.getElementById("BFS");
	var DijkstraButton = document.getElementById("Dijkstra");
	var AStarButton = document.getElementById("AStar");
	var alterGraphButton = document.getElementById("alter-graph");
	var saveButton = document.getElementById("save");
	var loadButton = document.getElementById("load");

	BFSIteratorButton.addEventListener("click", handleBFSIterator);
	DijkstraButton.addEventListener("click", handleDijkstraIterator);
	AStarButton.addEventListener("click", handleAStarIterator);
	alterGraphButton.addEventListener("click", handleAlterGraphClick);
	saveButton.addEventListener("click", handleSave);
	loadButton.addEventListener("click", handleLoad);
	// DFSIteratorButton.addEventListener("click", handleDFSIterator);

	// EventBus.subscribe("node-selected", startIterator);
	EventBus.subscribe("node-selected", selectNodeForConnecting);
}

var selectNodeForConnecting = function (nodeId) {
	if (nodeId == null) {
		return;
	}

	if (selectionState.tool == "LINE") {
		firstNode = nodeId;
		renderer.playPulseAnimation(nodeId);
	} else if (selectionState.tool == "HAND") {
		movingNode = nodeId;
		renderer.playPulseAnimation(nodeId);
	} else if (selectionState.tool == "ITERATOR") {
		firstNode = nodeId;

		if (selectionState.waitForStartingNode && selectionState.waitForGoalNode) {
			selectionState.waitForStartingNode = false;
			selectionState.startNode = firstNode;
			return;
		}
		if (!selectionState.waitForStartingNode && selectionState.waitForGoalNode
			&& selectionState.startNode) {
			selectionState.goalNode = firstNode;
			selectionState.waitForGoalNode = false;
			startIterator(selectionState.startNode, selectionState.goalNode);
			selectionState.startNode = null;
			selectionState.goalNode = null;
			return;
		}
		
		startIterator(firstNode);
	}
}

var handleDijkstraIterator = function () {
	var iterator = new DijkstraIterator(graph);
	selectionState.tool = "ITERATOR";
	initializeIterator(iterator);
}

var handleBFSIterator = function () {
	var iterator = new BFSIterator(graph);
	selectionState.tool = "ITERATOR";
	initializeIterator(iterator);
}

var handleAStarIterator = function () {
	var iterator = new AStarIterator(graph);
	selectionState.tool = "ITERATOR";
	selectionState.waitForGoalNode = true;
	initializeIterator(iterator);
}

var handleLoad = function () {
	var name = prompt("Изберете име на граф");

	$.ajax({
		method: "GET",
		url: "http://localhost:8080/load",
		dataType: "json",
		data: {
			name: name,
		},
		error: function (err) {
			console.log(err);
		}
	}).done(function(data) {
		manager.setGraph(graph, data);
	});
}

var handleAlterGraphClick = function () {
	var population = new Population();
	for (var i = 0; i < 100; i++) {
		var newIndividual = Population.generateRandomGraph(graph);
		population.addIndividual(newIndividual);
	}

	population.countIntersections();

	for (var i = 0; i < 40; i++) {
		population.evolvePopulation();
		console.log(population.getBestIndividual().intersections);
	}
}

var handleSave = function () {
	var name = prompt("Изберете име на графа");

	$.ajax({
		method: "POST",
		url: "http://localhost:8080/save",
		contentType: "text/json",
		data: JSON.stringify({
			name: name,
			graph: graph,
			edgeCounter: manager.edgeCounter,
			nodeCounter: manager.nodeCounter
		})
	});
}

var initializeIterator = function (iterator) {
	if (selectionState.iterator) {
		selectionState.iterator.reset();
	}
	selectionState.iterator = iterator;
	selectionState.waitForStartingNode = true;
}

var startIterator = function (nodeId, secondId) {
	if (selectionState.tool == "ITERATOR") {
		if (selectionState.waitForGoalNode) {
			return;
		}
		selectionState.iterator.start(nodeId, secondId);
		selectionState.waitForStartingNode = false;
	}
}