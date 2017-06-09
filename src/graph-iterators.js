'use strict';

var DFSIterator = function (graph) {
	this.graph = graph;
	this.stack = [];
	this.used = [];
	this.started = false;
	this.level = 1;
	this.neighbours = null;
	this.parent = null;
};

DFSIterator.prototype.next = function () {
	if (!this.started) {
		return;
	}

	this.currentState++;
	if (this.currentState >= this.states.length) {
		this.currentState = this.states.length - 1;
	}

	const nextState = this.states[this.currentState];
	return nextState;
};

DFSIterator.prototype.previous = function () {
	if (!this.started) {
		return;
	}

	this.currentState--;

	if(this.currentState < 0) {
		this.currentState = 0;
	}

	const prevState = this.states[this.currentState];
	return prevState;
};

DFSIterator.prototype.start = function (startVertex) {
	if (this.started) {
		return;
	}

	let initialState = {};
	for (let node in this.graph.nodes) {
		this.discovered[node] = false;
		initialState[node] = { visited: false, toBeVisited: false };
	}

	this.started = true;
	this.parent = startVertex.index;
	this.neighbours = startVertex.neighbours;
	this.used[startVertex.index] = this.level;
	startVertex.rootNode = true;
	startVertex.color = ROOT_NODE_COLOR;
	startVertex.fill = true;

	this.next();
};

DFSIterator.prototype.reset = function () {
	this.level = 1;
	this.stack = [];
	this.used = [];
	this.started = false;

	var states = this.graph.states;
	for (var nodeId in states) {
		states[nodeId].active = false;
		states[nodeId].visited = false;
		states[nodeId].toBeVisited = false;
		states[nodeId].parentId = null;
		states[nodeId].distance = null;
	}
};

var DijkstraIterator = function(graph) {
	this.distances = {};
	this.previousNodes = {};
	this.graph = graph;
	this.visited = [];
	this.states = [];
	this.currentState = -1;
	this.started = false;
};

DijkstraIterator.prototype.next = function () {
	if (!this.started) {
		return;
	}

	this.currentState++;
	if (this.currentState >= this.states.length) {
		this.currentState = this.states.length - 1;
	}

	const nextState = this.states[this.currentState];
	return nextState;
};

DijkstraIterator.prototype.previous = function () {
	if (!this.started) {
		return;
	}

	this.currentState--;

	if(this.currentState < 0) {
		this.currentState = 0;
	}

	const prevState = this.states[this.currentState];
	return prevState;
};

DijkstraIterator.prototype.start = function (startId) {
	if (this.started) {
		return;
	}

	this.started = true;
	var initialState = {};

	for (var nodeId in this.graph.nodes) {
		this.distances[nodeId] = Infinity;
		this.previousNodes[nodeId] = undefined;
		var node = this.graph.nodes[nodeId];
		initialState[nodeId] = { visited: false,
							   toBeVisited: false,
							   distance: Infinity,
							   parentId: undefined, };

		this.visited.push(nodeId);
	}

	this.distances[startId] = 0;
	initialState[startId].distance = 0;
	initialState[startId].visited = true;
	this.states.push(initialState);
	while (this.visited.length > 0) {
		var nodeId = _.min(this.visited, function (id) {
			return this.distances[id];
		}.bind(this));

		_.remove(this.visited, function (id) {
			return id == nodeId;
		});

		var node = this.graph.nodes[nodeId];
		var state = _.cloneDeep(this.states[this.states.length - 1]);

		state[nodeId].visited = true;

		for (var i = 0; i < node.edges.length; i++) {
			var edge = this.graph.edges[node.edges[i]];
			var alt = this.distances[nodeId] + edge.weight;

			if (alt < this.distances[edge.to]) {
				state[edge.to].parentId = nodeId;
				state[edge.to].distance = alt;
				state[edge.to].toBeVisited = true;
				this.distances[edge.to] = alt;
				this.previousNodes[edge.to] = nodeId;
			}
		}

		if (state[nodeId].distance != Infinity) {
			this.states.push(state);
		}
	}
};

DijkstraIterator.prototype.reset = function () {
	this.distances = {};
	this.previousNodes = {};
	this.graph = graph;
	this.visited = [];
	this.states = [];
	this.currentState = -1;
	this.started = false;

	var states = this.graph.states;
	for (var nodeId in states) {
		states[nodeId].active = false;
		states[nodeId].visited = false;
		states[nodeId].toBeVisited = false;
		states[nodeId].parentId = null;
		states[nodeId].distance = null;
	}
};

var BFSIterator = function (graph) {
	this.queue = [];
	this.graph = graph;
	this.discovered = {};
	this.started = false;
	this.currentState = -1;
	this.states = [];
};

BFSIterator.prototype.next = function () {
	if (!this.started) {
		return;
	}

	this.currentState++;
	if (this.currentState >= this.states.length) {
		this.currentState = this.states.length - 1;
	}

	const nextState = this.states[this.currentState];
	return nextState;
};

BFSIterator.prototype.previous = function () {
	if (!this.started) {
		return;
	}

	this.currentState--;

	if(this.currentState < 0) {
		this.currentState = 0;
	}

	const prevState = this.states[this.currentState];
	return prevState;
};

BFSIterator.prototype.start = function (startId) {
	if (this.started) {
		return;
	}

	var initialState = {};
	for (var node in this.graph.nodes) {
		this.discovered[node] = false;
		initialState[node] = { visited: false, toBeVisited: false };
	}

	this.started = true;
	this.queue.push(startId);
	initialState[startId].toBeVisited = true;
	initialState[startId].level = 0;
	this.states.push(initialState);
	this.discovered[startId] = true;

	while (this.queue.length > 0) {
		var parentId = this.queue.shift();
		var state = _.cloneDeep(this.states[this.states.length - 1]);
		state[parentId].visited = true;
		var edgesTo = this.graph.nodes[parentId].edges;
		for (var i = 0; i < edgesTo.length; i++) {
			var childId = this.graph.edges[edgesTo[i]].to;
			if (!this.discovered[childId]) {
				this.queue.push(childId);
				state[childId].toBeVisited = true;
				state[childId].level = state[parentId].level + 1;
				state[childId].parentId = parentId;
				this.discovered[childId] = true;
			}
		}

		this.states.push(state);
	}
};

BFSIterator.prototype.reset = function () {
	this.queue = [];
	this.discovered = {};
	this.started = false;
	this.currentState = -1;
	this.states = [];

	var states = this.graph.states;
	for (var nodeId in states) {
		states[nodeId].active = false;
		states[nodeId].visited = false;
		states[nodeId].toBeVisited = false;
		states[nodeId].level = null;
	}
};


var AStarIterator = function (grah) {
	this.graph = graph;
	this.states = [];
	this.currentState = -1;
	this.started = false;

	this.GScore = {};
	this.FScore = {};
	this.HScore = {};
};

AStarIterator.prototype.start = function (startId, finishId) {
	if (this.started) {
		return;
	}
	this.started = true;

	var closedSet = [];
	var openSet = [startId];
	var cameFrom = {};

	var initialState = {};
	for (var node in this.graph.nodes) {
		initialState[node] = {
			isOpen: false,
			isClosed: false,
			onPath: false,
			isStart: false,
			isGoal: false
		};
	}
	initialState[startId].isStart = true;
	initialState[finishId].isGoal = true;
	this.states.push(initialState);

	this.GScore[startId] = 0;
	this.FScore[startId] = this.GScore[startId] + this.heuristic(startId, finishId);

	while (openSet.length > 0) {
		var state = _.cloneDeep(this.states[this.states.length - 1]);
		var current = _.min(openSet, function (nodeId) {
			return this.FScore[nodeId];
		}.bind(this));

		if (current == finishId) {
			//TODO : reconstruct path
			// this.reconstructPath(startId, finishId);
			return;
		}

		_.remove(openSet, function (current, nodeId) {
			return nodeId == current;
		}.bind(this, current));//TODO
		closedSet.push(current);

		state[current].isClosed = true;
		state[current].isOpen = false;

		var edges = this.graph.nodes[current].edges;
		for (var i = 0; i < edges.length; i++) {
			var edge = this.graph.edges[edges[i]];
			var neighbourId = edge.to;
			if (closedSet.indexOf(neighbourId) > -1) {
				continue;
			}

			var tentativeGScore = this.GScore[current] + edge.weight;
			if (openSet.indexOf(neighbourId) == -1 ||
				tentativeGScore < this.GScore[neighbourId]) {

				cameFrom[neighbourId] = current;
				if (neighbourId != finishId) {
					state[neighbourId].onPath = true;
				}
				this.GScore[neighbourId] = tentativeGScore;
				this.FScore[neighbourId] = this.GScore[neighbourId] + this.heuristic(neighbourId, finishId);
				state[neighbourId].distance = Math.ceil(this.GScore[neighbourId]);

				if (openSet.indexOf(neighbourId) == -1) {
					openSet.push(neighbourId);
					if (neighbourId != finishId) {
						state[neighbourId].isOpen = true;
					}
				}
			}
		}
		this.states.push(state);
	}
};

AStarIterator.prototype.next = function () {
	if (!this.started) {
		return;
	}

	this.currentState++;
	if (this.currentState >= this.states.length) {
		this.currentState = this.states.length - 1;
	}

	const nextState = this.states[this.currentState];
	return nextState;
};

AStarIterator.prototype.previous = function () {
	if (!this.started) {
		return;
	}

	this.currentState--;

	if(this.currentState < 0) {
		this.currentState = 0;
	}

	const prevState = this.states[this.currentState];
	return prevState;
};

AStarIterator.prototype.heuristic = function (first, second) {
	var firstTransform = this.graph.transformations[first];
	var secondTransform = this.graph.transformations[second];

	var dir = {
		x: secondTransform.x - firstTransform.x,
		y: secondTransform.y - firstTransform.y
	};
	var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);

	return len;
}

AStarIterator.prototype.reset = function () {
	this.states = [];
	this.currentState = -1;
	this.started = false;

	this.GScore = {};
	this.FScore = {};
	this.HScore = {};

	var states = this.graph.states;
	for (var nodeId in states) {
		states[nodeId].onPath = false;
		states[nodeId].isClosed = false;
		states[nodeId].isOpen = false;
		states[nodeId].isGoal = false;
		states[nodeId].isStart = false;
		states[nodeId].active = false;
		states[nodeId].visited = false;
		states[nodeId].toBeVisited = false;
		states[nodeId].parentId = null;
		states[nodeId].distance = null;
	}
}

module.exports = {
	BFSIterator,
	AStarIterator,
	DijkstraIterator
};
