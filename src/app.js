'use strict';

const constants = require('./constants');
const BFSIterator = require('./graph-iterators').BFSIterator;
const DijkstraIterator = require('./graph-iterators').DijkstraIterator;
const AStarIterator = require('./graph-iterators').AStarIterator;
const ButtonGroup = require('./button-group');
const GraphManager = require('./graph-manager').GraphManager;
const GraphUtil = require('./graph-manager').GraphUtil;
const ForceBasedController = require('./controller');
const Renderer = require('./renderer');
const InputManager = require('./input-manager');
const InteractManager = require('./interact-manager');
const UIState = require('./ui_state');
let selectionState = UIState.selectionState;

var context, canvas;
var canvasBoundaries;

var GraphData = function () {};

var firstNode = null;
var movingNode = null;

var leftPanel = new ButtonGroup();

var graph = new GraphData();
var input;
var manager;
let interactManager;
var forceController;
var renderer;

var handleKeyPress = function (event) {
	switch (event.keyCode) {
		case 37:
			if (selectionState.tool == 'ITERATOR') {
				const prevState = selectionState.iterator.previous();
				handlePreviousState(graph, prevState);
				graph.states = prevState;
			}
			break;

		case 39:
			if (selectionState.tool == 'ITERATOR') {
				const nextState = selectionState.iterator.next();
				handleNextState(graph, nextState);
				graph.states = nextState;
			}
			break;
	}
};

const detectMouseUp = (event) => {
	if (event.target != UIState.elements.canvas) {
		return;
	}

	switch (event.button) {
		case 0:
			interactManager.mouseUpFirst();
			break;

		case 2:
			interactManager.mouseUpSecond();
			break;
	}

	interactManager.resetState();
};

const detectMouseDown = (event) => {
	interactManager.resetState();
	if (event.button == 0) {
		interactManager.selectNode();
	}
}

const removeAnimations = (event) => {
	if (event.button == 0 && event.target != UIState.elements.canvas) {
		interactManager.resetState();
	}
}

const createNotDirectedGraph = function () {
	manager.createEmptyGraph(graph, false);
}

const createDirectedGraph = function () {
	manager.createEmptyGraph(graph, true);
}

const generateNotDirectedGraph = function () {
	manager.generateRandomGraph(graph, false, 15, 50, 0.6);
	graph.nodeSpeed = 60;
}

const generateDirectedGraph = function () {
	manager.generateRandomGraph(graph, true, 15, 50, 0.6);
	graph.nodeSpeed = 60;
}

var handleDijkstraIterator = function () {
	var iterator = new DijkstraIterator(graph);
	setIterator(iterator);
}

var handleBFSIterator = function () {
	var iterator = new BFSIterator(graph);
	setIterator(iterator);
}

var handleAStarIterator = function () {
	var iterator = new AStarIterator(graph);
	selectionState.waitForGoalNode = true;
	setIterator(iterator);
}

const initializeIterator = (iterator) => {
	if (selectionState.iterator) {
		selectionState.iterator.reset();
		handleResetState(graph, graph.states);
	}
	selectionState.iterator = iterator;
	selectionState.waitForStartingNode = true;
};

const setIterator = function (iterator) {
	selectionState.tool = 'ITERATOR';
	initializeIterator(iterator);
}

const handleLoad = () => {
	var name = prompt('Изберете име на граф');

	$.ajax({
		method: 'GET',
		url: 'http://localhost:8080/load',
		dataType: 'json',
		data: {
			name: name,
		},
		error: function (err) {
			console.log(err);
		}
	}).done(function (data) {
		manager.setGraph(graph, data);
	});
};

const handleSave = () => {
	var name = prompt('Изберете име на графа');

	$.ajax({
		method: 'POST',
		url: 'http://localhost:8080/save',
		contentType: 'text/json',
		data: JSON.stringify({
			name: name,
			graph: graph,
			edgeCounter: manager.edgeCounter,
			nodeCounter: manager.nodeCounter
		})
	});
};

window.onload = function () {
	UIState.initializeCanvasContext();
	UIState.attachUIListeners({
		createNotDirectedGraph,
		createDirectedGraph,
		generateNotDirectedGraph,
		generateDirectedGraph,
		handleBFSIterator,
		handleDijkstraIterator,
		handleAStarIterator,
		handleSave,
		handleLoad
	});

	manager = new GraphManager();
	manager.createEmptyGraph(graph, false);
	forceController = new ForceBasedController(graph, 0, 50, UIState.elements.canvas.height, UIState.elements.canvas.width);
	renderer = new Renderer(UIState.elements.context, graph);
	input = new InputManager(UIState.elements.canvas);

	interactManager = new InteractManager(forceController, manager, graph, renderer, input);

	input.detectMouseUp(removeAnimations);
	input.detectMouseUp(detectMouseUp);
	input.detectMouseDown(detectMouseDown);

	var handButton = leftPanel.addButton(document.getElementById('hand_icon'));
	var lineButton = leftPanel.addButton(document.getElementById('line'));

	leftPanel.select(handButton);

	leftPanel.addListener(handButton, function (selectionState) {
		if (selectionState.iterator) {
			selectionState.iterator.reset();
			handleResetState(graph, graph.states);
			selectionState.iterator = null;
		}
		selectionState.tool = 'HAND';
	}.bind(undefined, selectionState));

	leftPanel.addListener(lineButton, function (selectionState) {
		if (selectionState.iterator) {
			selectionState.iterator.reset();
			handleResetState(graph, graph.states);
			selectionState.iterator = null;
		}
		selectionState.tool = 'LINE';
	}.bind(undefined, selectionState));

	window.addEventListener('keyup', handleKeyPress);

	update();
};

var handleResetState = function (graph, state) {
	for (var id in state) {
		var nodeAnimationState = graph.animationStates[id];

		if (state[id].visited) {
			nodeAnimationState.fillColor = constants.VISITED_FILL_STYLE;
			nodeAnimationState.color = constants.VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (state[id].toBeVisited) {
			nodeAnimationState.color = constants.TO_BE_VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = false;
		} else if (state[id].isOpen) {
			nodeAnimationState.color = constants.TO_BE_VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = false;
		} else if (state[id].onPath) {
			nodeAnimationState.fillColor = constants.ON_PATH_FILL_STYLE;
			nodeAnimationState.color = constants.ON_PATH_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (state[id].isStart) {
			nodeAnimationState.fillColor = constants.START_NODE_FILL_STYLE;
			nodeAnimationState.color = constants.START_NODE_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (state[id].isGoal) {
			nodeAnimationState.fillColor = constants.GOAL_NODE_FILL_STYLE;
			nodeAnimationState.color = constants.GOAL_NODE_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else {
			nodeAnimationState.color = constants.NORMAL_STROKE_STYLE;
			nodeAnimationState.fill = false;
			nodeAnimationState.fillColor = constants.NORMAL_FILL_STYLE;
		}
	}
}

var handlePreviousState = function (graph, prevState) {
	for (var nodeId in prevState) {
		var nodeAnimationState = graph.animationStates[nodeId];

		if (prevState[nodeId].visited) {
			nodeAnimationState.fillColor = constants.VISITED_FILL_STYLE;
			nodeAnimationState.color = constants.VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (prevState[nodeId].toBeVisited) {
			nodeAnimationState.color = constants.TO_BE_VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = false;
		} else if (prevState[nodeId].isOpen) {
			nodeAnimationState.color = constants.TO_BE_VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = false;
		} else if (prevState[nodeId].onPath) {
			nodeAnimationState.fillColor = constants.ON_PATH_FILL_STYLE;
			nodeAnimationState.color = constants.ON_PATH_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (prevState[nodeId].isStart) {
			nodeAnimationState.fillColor = constants.START_NODE_FILL_STYLE;
			nodeAnimationState.color = constants.START_NODE_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (prevState[nodeId].isGoal) {
			nodeAnimationState.fillColor = constants.GOAL_NODE_FILL_STYLE;
			nodeAnimationState.color = constants.GOAL_NODE_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else {
			nodeAnimationState.color = constants.NORMAL_STROKE_STYLE;
			nodeAnimationState.fill = false;
			nodeAnimationState.fillColor = constants.NORMAL_FILL_STYLE;
		}
	}
};

var handleNextState = function (graph, nextState) {
	let currentState = graph.states;

	for (var nodeId in nextState) {
		var nodeAnimationState = graph.animationStates[nodeId];

		if (nextState[nodeId].visited) {
			nodeAnimationState.fillColor = constants.VISITED_FILL_STYLE;
			nodeAnimationState.color = constants.VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (nextState[nodeId].toBeVisited) {
			nodeAnimationState.color = constants.TO_BE_VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = false;
		} else if (nextState[nodeId].isOpen) {
			nodeAnimationState.color = constants.TO_BE_VISITED_OUTLINE_STYLE;
			nodeAnimationState.fill = false;
		} else if (nextState[nodeId].onPath) {
			nodeAnimationState.fillColor = constants.ON_PATH_FILL_STYLE;
			nodeAnimationState.color = constants.ON_PATH_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (nextState[nodeId].isStart) {
			nodeAnimationState.fillColor = constants.START_NODE_FILL_STYLE;
			nodeAnimationState.color = constants.START_NODE_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else if (nextState[nodeId].isGoal) {
			nodeAnimationState.fillColor = constants.GOAL_NODE_FILL_STYLE;
			nodeAnimationState.color = constants.GOAL_NODE_OUTLINE_STYLE;
			nodeAnimationState.fill = true;
		} else {
			nodeAnimationState.color = constants.NORMAL_STROKE_STYLE;
			nodeAnimationState.fill = false;
			nodeAnimationState.fillColor = constants.NORMAL_FILL_STYLE;
		}

		if (currentState[nodeId].visited != nextState[nodeId].visited &&
			nextState[nodeId].visited && nextState[nodeId].parentId != undefined) {
			var parentTransformation = graph.transformations[nextState[nodeId].parentId];
			var currentTransformation = graph.transformations[nodeId];

			renderer.lerpLine(parentTransformation.x,
							  parentTransformation.y,
							  currentTransformation.x,
							  currentTransformation.y,
							  constants.ITERATION_EDGE_COLORING, 1000);
		}
	}
};

var update = function () {
	renderer.clear();
	renderer.render();

	interactManager.update();


	if (selectionState.tool == 'ITERATOR') {
		if (selectionState.waitForStartingNode || selectionState.waitForGoalNode) {
			renderer.renderText(input.mouse.x, input.mouse.y, 'Изберете връх', 'orange');
		}
		if (selectionState.iterator.started) {
			renderer.renderText(350, 20, 'Използвайте стрелките, за да навигирате алгоритъма', 'blue');
			renderer.renderProgressBar(350, 50, 300, 30, selectionState.iterator.currentState + 1,
										  selectionState.iterator.states.length);
		}
	}

	forceController.update();

	setTimeout(update, 1000 / 60);
}