var selectionState = {};
selectionState.firstNode = null;
selectionState.iterator = null;
selectionState.tool = "HAND";


var attachUIListeners = function () {
	var BFSIteratorButton = document.getElementById("BFS");
	var DijkstraButton = document.getElementById("Dijkstra");

	BFSIteratorButton.addEventListener("click", handleBFSIterator);
	DijkstraButton.addEventListener("click", handleDijkstraIterator);
	// DFSIteratorButton.addEventListener("click", handleDFSIterator);

	EventBus.subscribe("node-selected", startIterator);
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
		//TODO: Move the nodes
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

var initializeIterator = function (iterator) {
	if (selectionState.iterator) {
		selectionState.iterator.reset();
	}
	selectionState.iterator = iterator;
	selectionState.waitForStartingNode = true;
}

var startIterator = function (nodeId) {
	if (selectionState.tool == "ITERATOR") {
		selectionState.iterator.start(nodeId);
		selectionState.waitForStartingNode = false;
	}
}