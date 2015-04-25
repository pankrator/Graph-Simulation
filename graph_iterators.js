var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var SEEN_NODE_COLOR = "green";
var FINISHED_NODE_COLOR = "black";
var ROOT_NODE_COLOR = "blue";
// var NEIGHBOUR_NODE_COLOR = "blue"; 
// var SEEN_NODE_COLOR = ctx.createRadialGradient(20, 30, 30, 60, 60, 20);
// SEEN_NODE_COLOR.addColorStop(0, "green");
// SEEN_NODE_COLOR.addColorStop(1, "blue");

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
	for (var i = 0; i < this.neighbours.length; i++) {
		if (!this.used[this.neighbours[i]]) {
			this.recursive(this.neighbours[i], this.parent)
			return;
		}
	}
	if (this.parent == null) {
		return;
	}
	if (!this.graph.list[this.parent].rootNode) {
		this.graph.list[this.parent].color = FINISHED_NODE_COLOR;
		this.graph.list[this.parent].fill - true;
	}

	this.parent = this.graph.list[this.parent].parent;
	if (this.parent == null) {
		return;
	}
	this.neighbours = this.graph.list[this.parent].neighbours;
	
	this.next();
};

DFSIterator.prototype.recursive = function (v, parent) {
	this.used[v] = (parent !== undefined && parent != null) ? this.used[parent] + 1 : 1;
	var node = this.graph.list[v];
	node.color = SEEN_NODE_COLOR;
	node.fill = true;
	// node.radius = 40;
	node.level = this.used[v] + 1;
	node.parent = parent;
	var neighbours = node.neighbours;

	if (neighbours.length > 1)  {
		this.parent = v;
		this.neighbours = neighbours;
	} else {
		node.color = FINISHED_NODE_COLOR;
		node.fill = true;
	}
};

DFSIterator.prototype.start = function (startVertex) {
	if (this.started) {
		return;
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

	var list = this.graph.list;
	for (var i = 0; i < list.length; i++) {
		list[i].rootNode = false;
		list[i].color = null;
		list[i].fill = null;
		list[i].level = null;
		list[i].radius = 30; // Magic
		list[i].parent = null;
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

BFSIterator.prototype.next = function() {
	this.currentState++;
	if (this.currentState >= this.states.length) {
		this.currentState = this.states.length - 1;
	}

	EventBus.publish("next-state", this.graph.states, this.states[this.currentState]);
	
	this.graph.states = this.states[this.currentState];
};

BFSIterator.prototype.previous = function() {
	this.currentState--;

	if(this.currentState < 0) {
		this.currentState = 0;
	}

	this.graph.states = this.states[this.currentState];
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
	this.previousNodes = [];
	this.nextNodes = [];
	this.discovered = {};

	var states = this.graph.states;
	for (var nodeId in states) {
		states[nodeId].active = false;
		states[nodeId].visited = false;
	}
};
