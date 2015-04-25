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

var createNode = function () {
	var nodeIndex = manager.addNode(graph);
	EventBus.publish("add-node", nodeIndex, 
							 	 input.mouse.x,
							 	 input.mouse.y,
							 	 30);
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

var createNode = function () {
	if (firstNode == null) {
		var nodeIndex = manager.addNode(graph);
		EventBus.publish("add-node", nodeIndex, 
								 	 input.mouse.x,
								 	 input.mouse.y,
								 	 30);
	}
};

var removeNode = function () {
	var nodeToRemove = forceController.getNodeIdByCoordinates(input.mouse.x,
															  input.mouse.y);
	
	if(nodeToRemove != null) {
		manager.removeNode(graph, nodeToRemove);
		EventBus.publish("remove-node", nodeToRemove);
	}
}

var addEdge = function () {
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
};

var selectNode = function () {
	var nodeId = forceController.getNodeIdByCoordinates(input.mouse.x,
														input.mouse.y);
	if (nodeId != null) {
		firstNode = nodeId;
		renderer.playPulseAnimation(nodeId);
	}
};

var showEdgeChangeDialog = function (edge) {
	var newEdgeSize = prompt("Tell me edge size", edge.weight);
	if (newEdgeSize) {
		edge.weight = parseInt(newEdgeSize);
	}
};

var detectMouseUp = function (button) {
	if (button == 0) {
		if (firstNode == null) {
			var edge = forceController.getEdgeWeight(input.mouse.x,
										  input.mouse.y);
			if (edge != null) {
				showEdgeChangeDialog(edge);
			} else {
				createNode();				
			}
		} else {
			addEdge();
		}
	} 
	if (button == 2) {
		if (firstNode == null) {
			removeNode();
		}
	}
};

var detectMouseDown = function (button) {
	if (button == 0) {
		selectNode();	
	}
}

window.onload = function () {
	canvas = document.getElementById("area");
	context = canvas.getContext("2d");

	manager = new GraphManager();
	manager.createEmptyGraph(graph, true);
	forceController = new ForceBasedController(graph);
	renderer = new Renderer(context, graph);
	stateManager = new StateManager(graph);
	input = new InputManager(canvas);

	input.detectMouseUp(detectMouseUp);
	input.detectMouseDown(detectMouseDown);
	// input.detectMouseUp(addEdge);

	EventBus.subscribe("next-state", handleNextState);

	update();
}

var handleNextState = function (previousState, currentState) {
	for (var id in previousState) {

		if (previousState[id].visited != currentState[id].visited &&
			currentState[id].visited && currentState[id].parentId != undefined) {
			var parentTransformation = this.graph.transformations[currentState[id].parentId];
			var currentTransformation = this.graph.transformations[id];
			renderer.lerpLine(parentTransformation.x,
							  parentTransformation.y,
							  currentTransformation.x,
							  currentTransformation.y,
							  "yellow");
		}
	}
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