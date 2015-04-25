var context, canvas;
var canvasBoundaries;

var GraphData = function () {};

var firstNode = null;

var graph = new GraphData();
var input;
var manager;
var forceController;
var renderer;
var stateManager;

var test = function () {
	manager.createEmptyGraph(graph, false);
	graph.test = 1000;
}

var createNotDirectedGraph = function() {
	alert("lqlq");
	graph = manager.createEmptyGraph(false);
}

var createDirectedGraph = function() {
	graph = manager.createEmptyGraph(true);
}

document.getElementById("not_directed_graph").addEventListener("click", createNotDirectedGraph);
document.getElementById("directed_graph").addEventListener("click", createDirectedGraph);
// document.getElementById("save").addEventListener("click", func);


var createNode = function (button) {
	if (firstNode == null && button == 0) {
		var nodeIndex = manager.addNode(graph);
		EventBus.publish("add-node", nodeIndex, 
								 	 input.mouse.x,
								 	 input.mouse.y,
								 	 30);
	}
};

var removeNode = function (button) {
	if(button == 2) {
		var nodeToRemove = forceController.getNodeIdByCoordinates(input.mouse.x,
																  input.mouse.y);
		
		if(nodeToRemove != null) {
			manager.removeNode(graph, nodeToRemove);
			EventBus.publish("remove-node", nodeToRemove);
		}
	}
}

var addEdge = function (button) {
	if (firstNode != null && button == 0) {
		var secondNode = forceController.getNodeIdByCoordinates(input.mouse.x,
																input.mouse.y);
		if (secondNode != null) {
			renderer.lerpLine(graph.transformations[firstNode].x,
							  graph.transformations[firstNode].y,
							  graph.transformations[secondNode].x,
							  graph.transformations[secondNode].y,
							  "blue",
			function (manager, graph, firstNode, secondNode) {
				// var secondNode = forceController.getNodeIdByCoordinates(input.mouse.x,
				// 												input.mouse.y);
				manager.addEdge(graph, firstNode, secondNode, 10);
				EventBus.publish("add-edge");				
			}.bind(this, manager, graph, firstNode, secondNode));
		}
		renderer.stopPulseAnimation(firstNode);
		firstNode = null;
	} else if (button == 2) {
		removeNode(button);
	}
};

var selectNode = function (button) {
	if (button == 0) {
		var nodeId = forceController.getNodeIdByCoordinates(input.mouse.x,
															input.mouse.y);
		if (nodeId != null) {
			firstNode = nodeId;
			renderer.playPulseAnimation(nodeId);
		}
	}
};

window.onload = function () {
	canvas = document.getElementById("area");
	context = canvas.getContext("2d");

	manager = new GraphManager();
	manager.createEmptyGraph(graph, true);
	forceController = new ForceBasedController(graph, true);
	renderer = new Renderer(context, graph);
	stateManager = new StateManager(graph);
	input = new InputManager(canvas);

	input.detectMouseUp(createNode);
	input.detectMouseDown(selectNode);
	input.detectMouseUp(addEdge);
	
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