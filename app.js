var context, canvas;
var canvasBoundaries;

var GraphData = function () {};

var firstNode = null;

var leftPannel = new ButtonGroup();

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
	manager.createEmptyGraph(graph, false);
}

var createDirectedGraph = function() {
	manager.createEmptyGraph(graph, true);
}

var generateNotDirectedGraph = function() {
	manager.generateRandomGraph(graph, false, 30, 50, 0.7);
	graph.nodeSpeed = 60;
}

var generateDirectedGraph = function() {
	manager.generateRandomGraph(graph, true, 30, 50, 0.7);
	graph.nodeSpeed = 60;
}

//TODO change functions
document.getElementById("not_directed_graph").addEventListener("click", createNotDirectedGraph);
document.getElementById("directed_graph").addEventListener("click", createDirectedGraph);
document.getElementById("generate_not_directed_graph").addEventListener("click", generateNotDirectedGraph);
document.getElementById("generate_directed_graph").addEventListener("click", generateDirectedGraph);
// document.getElementById("save").addEventListener("click", func);


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
						  "blue", 300,
		function (manager, graph, firstNode, secondNode) {
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
		EventBus.publish("node-selected", nodeId);		
	}
};

var showEdgeChangeDialog = function (edge) {
	var newEdgeSize = prompt("Tell me edge size", edge.weight);
	if (newEdgeSize) {
		edge.weight = parseInt(newEdgeSize);
	}
};

var handleKeyPress = function (event) {
	switch (event.keyCode) {
		case 37:
			if (selectionState.tool == "ITERATOR") {
				selectionState.iterator.previous();
			}
			break;

		case 39:
			if (selectionState.tool == "ITERATOR") {
				selectionState.iterator.next();
			}
			break;
	}
};

var detectMouseUp = function (event) {
	// stateMachine.sendInput(event, "up");

	if (event.target != canvas) {
		return;
	}

	switch (event.button) {
		case 0:
			if (firstNode == null && selectionState.tool == "HAND") {
				var edge = forceController.getEdgeWeight(input.mouse.x,
														 input.mouse.y);
				if (edge != null) {
					showEdgeChangeDialog(edge);
				} else {
					createNode();
				}
			} else if (selectionState.tool == "LINE" && firstNode != null) {
				addEdge();
			} else if (selectionState.tool == "ITERATOR" && firstNode != null) {
				startIterator(firstNode);
			}
			break;

		case 2:
			if (firstNode == null && selectionState.tool == "HAND") {
				removeNode();
			}
			break;
	}
};

var detectMouseDown = function (event) {
	// stateMachine.sendInput(event, "down");

	if (event.button == 0) {
		selectNode();
	}
}

var removeAnimations = function (event) {
	if (event.button == 0 && firstNode != null && event.target != canvas) {
		renderer.stopPulseAnimation(firstNode);
		firstNode = null;
	}
}

window.onload = function () {
	canvas = document.getElementById("area");
	context = canvas.getContext("2d");

	manager = new GraphManager();
	manager.createEmptyGraph(graph, true);
	forceController = new ForceBasedController(graph, 0, 50, canvas.height, canvas.width);
	renderer = new Renderer(context, graph);
	stateManager = new StateManager(graph);
	input = new InputManager(canvas);

	input.detectMouseUp(removeAnimations);
	input.detectMouseUp(detectMouseUp);
	input.detectMouseDown(detectMouseDown);

	EventBus.subscribe("state-reset", handleResetState);
	EventBus.subscribe("next-state", handleNextState);
	EventBus.subscribe("previous-state", handlePreviousState);

	var handButton = leftPannel.addButton(document.getElementById("hand_icon"));
	var lineButton = leftPannel.addButton(document.getElementById("line"));

	leftPannel.select(handButton);

	leftPannel.addListener(handButton, function (selectionState) {
		if (selectionState.iterator) {
			selectionState.iterator.reset();
			selectionState.iterator = null;
		}
		selectionState.tool = "HAND";
	}.bind(undefined, selectionState));

	leftPannel.addListener(lineButton, function (selectionState) {
		if (selectionState.iterator) {
			selectionState.iterator.reset();
			selectionState.iterator = null;
		}
		selectionState.tool = "LINE";
	}.bind(undefined, selectionState));

	window.addEventListener("keyup", handleKeyPress);

	attachUIListeners();

	update();
};

var handleResetState = function (state) {
	for (var id in state) {
	var currentAnimationState = this.graph.animationStates[id];

	if (state[id].visited) {
		currentAnimationState.fillColor = VISITED_FILL_STYLE;
		currentAnimationState.color = VISITED_OUTLINE_STYLE;
		currentAnimationState.fill = true;
	} else if (state[id].toBeVisited) {
		currentAnimationState.color = TO_BE_VISITED_OUTLINE_STYLE;
		currentAnimationState.fill = false;
	} else {
		currentAnimationState.color = NORMAL_STROKE_STYLE;
		currentAnimationState.fill = false;
		currentAnimationState.fillColor = NORMAL_FILL_STYLE;
	}
	}
}

var handlePreviousState = function (previousState, currentState) {
	for (var id in currentState) {
		var currentAnimationState = this.graph.animationStates[id];

		if (currentState[id].visited) {
			currentAnimationState.fillColor = VISITED_FILL_STYLE;
			currentAnimationState.color = VISITED_OUTLINE_STYLE;
			currentAnimationState.fill = true;
		} else if (currentState[id].toBeVisited) {
			currentAnimationState.color = TO_BE_VISITED_OUTLINE_STYLE;
			currentAnimationState.fill = false;
		} else {
			currentAnimationState.color = NORMAL_STROKE_STYLE;
			currentAnimationState.fill = false;
			currentAnimationState.fillColor = NORMAL_FILL_STYLE;
		}
	}
};

var handleNextState = function (previousState, currentState) {
	for (var id in currentState) {
		var currentAnimationState = this.graph.animationStates[id];

		if (currentState[id].visited) {
			currentAnimationState.fillColor = VISITED_FILL_STYLE;
			currentAnimationState.color = VISITED_OUTLINE_STYLE;
			currentAnimationState.fill = true;
		} else if (currentState[id].toBeVisited) {
			currentAnimationState.color = TO_BE_VISITED_OUTLINE_STYLE;
			currentAnimationState.fill = false;
		} else {
			currentAnimationState.color = NORMAL_STROKE_STYLE;
			currentAnimationState.fill = false;
			currentAnimationState.fillColor = NORMAL_FILL_STYLE;
		}

		if (previousState[id].visited != currentState[id].visited &&
			currentState[id].visited && currentState[id].parentId != undefined) {
			var parentTransformation = this.graph.transformations[currentState[id].parentId];
			var currentTransformation = this.graph.transformations[id];

			renderer.lerpLine(parentTransformation.x,
							  parentTransformation.y,
							  currentTransformation.x,
							  currentTransformation.y,
							  ITERATION_EDGE_COLORING, 500);
		}
	}
};

var update = function () {
	renderer.clear();
	renderer.render();

	if (firstNode && selectionState.tool == "LINE") {
		renderer.renderLine(
			forceController.getCircleCoordinatesOnNode(input.mouse.x,
													   input.mouse.y,
													   firstNode),
			{
				x: input.mouse.x,
				y: input.mouse.y
		}, "red");
	}

	if (selectionState.tool == "ITERATOR") {
		if (selectionState.waitForStartingNode) {
			renderer.renderText(input.mouse.x, input.mouse.y, "Изберете връх", "orange");
		}
		if (selectionState.iterator.started) {
			renderer.renderText(350, 20, "Използвайте стрелките, за да навигирате алгоритъма", "blue");
			renderer.renderProgressBar(350, 50, 150, 20, selectionState.iterator.currentState + 1,
										  selectionState.iterator.states.length);
		}
	}


	forceController.update();

	setTimeout(update, 1000 / 60);
}