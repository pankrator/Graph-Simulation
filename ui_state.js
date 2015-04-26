var selectionState = {};
selectionState.firstNode = null;
selectionState.iterator = null;
selectionState.tool = "HAND";


var attachUIListeners = function () {
	var BFSIteratorButton = document.getElementById("BFS");
	var DFSIteratorButton = document.getElementById("DFS");

	BFSIteratorButton.addEventListener("click", handleBFSIterator);
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

var handleBFSIterator = function () {
	var iterator = new BFSIterator(graph);
	selectionState.iterator = iterator;
	selectionState.tool = "ITERATOR";
	selectionState.waitForStartingNode = true;
}

var handleDFSIterator = function () {
	var iterator = new DFSIterator(graph);
	selectionState.iterator = iterator;
	selectionState.tool = "ITERATOR";
	selectionState.waitForStartingNode = true;
}

var startIterator = function (nodeId) {
	if (selectionState.tool == "ITERATOR") {
		selectionState.iterator.start(nodeId);
		selectionState.waitForStartingNode = false;
	}
}