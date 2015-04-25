var context, canvas;
var canvasBoundaries;

// var selectNodeForIteration = false;
// var iteratorMessage = null;

// var graphManager = new GraphManager();
// var graph = graphManager.createEmptyGraph(new ForceBasedGraphController());
// var iterator;

// var graphComponents = {
// 	firstNode: null,
// };

var firstNode = null;

var graph;
var input;
var manager;
var forceController;
var renderer;
var stateManager;

var createNode = function () {
	if (firstNode == null) {
		var nodeIndex = manager.addNode(graph);
		EventBus.publish("add-node", nodeIndex, 
								 	 input.mouse.x,
								 	 input.mouse.y,
								 	 30);
	}
};

var addEdge = function () {
	if (firstNode != null) {
		var secondNode = forceController.getNodeIdByCoordinates(input.mouse.x,
																input.mouse.y);
		if (secondNode != null) {
			renderer.lerpLine(graph.transformations[firstNode].x,
										  graph.transformations[firstNode].y,
										  graph.transformations[secondNode].x,
										  graph.transformations[secondNode].y,
										  "blue",
			function (manager, graph, firstNode, secondNode) {
				manager.addEdge(graph, firstNode, secondNode);
				EventBus.publish("add-edge");				
			}.bind(this, manager, graph, firstNode, secondNode));
		}
		renderer.stopPulseAnimation(firstNode);
		firstNode = null;
	}
};

var selectNode = function () {
	var nodeId = forceController.getNodeIdByCoordinates(input.mouse.x,
														input.mouse.y);
	if (nodeId != null) {
		firstNode = nodeId;
		renderer.playPulseAnimation(nodeId);
	}
};

window.onload = function () {
	canvas = document.getElementById("area");
	context = canvas.getContext("2d");

	manager = new GraphManager();
	graph = manager.createEmptyGraph(true);
	forceController = new ForceBasedController(graph);
	renderer = new Renderer(context, graph);
	stateManager = new StateManager(graph);

	input = new InputManager(canvas);

	input.detectMouseUp(createNode);
	input.detectMouseDown(selectNode);
	input.detectMouseUp(addEdge);

	// window.addEventListener("keydown", keyboardListener);
	// canvas.addEventListener("mousemove", mouseMoveListener);
	// canvas.addEventListener("click", mouseClickListener);
	// canvas.addEventListener("mousedown", mouseDownListener);
	// canvas.addEventListener("mouseup", mouseUpListener);
	// canvas.addEventListener("contextmenu", contextMenuListener);
	
	// var bfsButton = document.getElementById("BFSButton");
	// bfsButton.onclick = function () {
	// 	iterator = new BFSIterator(graph);
	// 	selectNodeForIteration = true;
	// 	iteratorMessage = "Select node to start BFS";
	// };

	// var dfsButton = document.getElementById("DFSButton");
	// dfsButton.onclick = function () {
	// 	iterator = new DFSIterator(graph);
	// 	selectNodeForIteration = true;
	// 	iteratorMessage = "Select node to start DFS";
	// };

	// context.font = "normal 20px Arial";
	// canvasBoundaries = canvas.getBoundingClientRect();
	
	update();
}

var contextMenuListener = function (ev) {
	event.preventDefault();
	graphManager.removeNodeOnCoordinates(graph, mouse.x, mouse.y);
}

var mouseUpListener = function(ev) {
	if (graphComponents.firstNode != null) {
		var otherNode = graphManager.getGraphNodeByCoordinates(graph, mouse.x, mouse.y);
		if (otherNode != null) {
			graphManager.connectNodes(graph, graphComponents.firstNode, otherNode);
		}
	}
}

var mouseDownListener = function (ev) {
	if(ev.button == 0) {
		var result = graphManager.getGraphNodeByCoordinates(graph, mouse.x, mouse.y);
		if(result != null) {
			graphComponents.firstNode = result;
		}
	}
}

var mouseClickListener = function (ev) {
	if (selectNodeForIteration === true) {
		var node = graphManager.getGraphNodeByCoordinates(graph, mouse.x, mouse.y);
		if (node != null) {
			selectNodeForIteration = false;
			iterator.start(graphManager.getGraphNodeByCoordinates(graph, mouse.x, mouse.y));
		} else {
			selectNodeForIteration = false;
		}
	}
	if (graphComponents.firstNode === null) {
		graphManager.addNode(graph, mouse.x, mouse.y);
	}
	graphComponents.firstNode = null;
}

var mouseMoveListener = function (ev) {
	var doc = document.documentElement;

	var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
	mouse.x = ev.x - canvasBoundaries.left;
	mouse.y = ev.y - canvasBoundaries.top + top;
}

var keyboardListener = function (ev) {
	if (ev.keyCode == 32) {
		iterator.reset();
	}
	if (ev.keyCode == 39) {
		iterator.next();
	}
}

var update = function () {
	renderer.clear();
	renderer.render();

	if (firstNode) {
		renderer.renderLine(
			forceController.getCircleCoordinatesOnNode(input.mouse.x,
													   input.mouse.y,
													   firstNode),
			{
				x: input.mouse.x,
				y: input.mouse.y
		}, "red");
	}

	forceController.update();

	// context.clearRect(0, 0, 1500, 2000);

	// graphManager.simulate(graph);
	// graphManager.draw(graph, context);

	// if (graphComponents.firstNode != null) {
	// 	var start = graphManager.getNodeCircleCoordinatesFromPosition(graph, 
	// 																  graphComponents.firstNode,
	// 																  mouse.x, mouse.y);
	// 	context.strokeStyle = "black";
	// 	context.moveTo(start.x, start.y);
	// 	context.lineTo(mouse.x, mouse.y);
	// 	context.stroke();
	// }

	// if (selectNodeForIteration) {
	// 	context.fillStyle = "red";
	// 	context.fillText(iteratorMessage, mouse.x, mouse.y - 10);
	// }

	setTimeout(update, 30);
}