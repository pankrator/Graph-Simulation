var GraphUtil = function () {};

GraphUtil.isTrueNodeOnly = function (node) {
	for(var propKey in node) {
		if (NODE_PROPERTIES.indexOf(propKey) === -1) {
			return false;
		}
	}

	return true;
}

GraphUtil.isDirected = function (graph) {
	return graph.directed;
}

var GraphManager = function () {
	this.nodeCounter = 0;
	this.edgeCounter = 0;
};

GraphManager.prototype.setGraph = function (graph, newData) {
	this.edgeCounter = parseInt(newData.edges);
	this.nodeCounter = parseInt(newData.nodes);

	var newGraph = newData.graph;
	for (var key in graph) {
		graph[key] = {};
		graph[key] = newGraph[key];

		// graph[key] = {};
		// for (var id in newGraph[key]) {
		// 	graph[key][id + 1] = newGraph[key][id];
		// }

	};
	graph.states = {};
	for (var id in graph.nodes) {
		graph.states[id] = {};
	}
}

GraphManager.prototype.createEmptyGraph = function (graph, directed) {
	graph.directed = directed;
	graph.nodes = {};
	graph.edges = {};
	this.nodeCounter = 0;
	this.edgeCounter = 0;
};

GraphManager.prototype.addNode = function (graph) {
	graph.nodes[Number(++this.nodeCounter).toString()] = {
		id: this.nodeCounter,
		edges: []
	};

	return this.nodeCounter;
	// EventBus.publish("add-node", this.nodeCounter);
	// graph.nodeSpeed = 20;
};


GraphManager.prototype.addEdge = function (graph, firstId, secondId, weight) {
	if (firstId == secondId) {
		return;
	}
	if (!GraphUtil.isDirected(graph)) {
		if (this.areConnected(graph, firstId, secondId) ||
			this.areConnected(graph, secondId, firstId)) {
			return;
		}
	} else {
		if (this.areConnected(graph, firstId, secondId)) {
			return;
		}
	}

	var edge = this.createEdge(firstId, secondId, weight);
	graph.edges[edge.id] = edge;

	if (GraphUtil.isDirected(graph)) {
		graph.nodes[firstId].edges.push(edge.id);
	} else {
		var reverseEdge = this.createEdge(secondId, firstId, weight);
		graph.edges[reverseEdge.id] = reverseEdge;

		graph.nodes[firstId].edges.push(edge.id);
		graph.nodes[secondId].edges.push(reverseEdge.id);
	}
};

GraphManager.prototype.areConnected = function (graph, firstId, secondId) {
	var firstEdges = graph.nodes[firstId].edges;

	for (var i = 0; i < firstEdges.length; i++) {
		var edge = graph.edges[firstEdges[i]];
		if (edge.from == firstId && edge.to == secondId) {
			return true;
		}
	}

	return false;
};

/*
	{
		id:
		weight:
		from: nodeId
		to: nodeId
	}
*/
GraphManager.prototype.createEdge = function (first, second, weight) {

	return {
		id: Number(++this.edgeCounter).toString(),
		weight: weight != undefined ? weight : 0,
		from: first,
		to: second
	};
};

GraphManager.prototype.removeNode = function(graph, nodeId) {
	var edgesToRemove = [];
	for (var edge in graph.edges) {
	if (graph.edges[edge].from == nodeId ||
			graph.edges[edge].to == nodeId) {
			var nodeFrom = graph.nodes[graph.edges[edge].from];
		var edgeIndex = nodeFrom.edges.indexOf(parseInt(edge));
			
			if(edgeIndex > -1) {
				nodeFrom.edges.splice(edgeIndex, 1);
				edgesToRemove.push(edge);
			}
		}
	}

	for (var i = 0; i < edgesToRemove.length; i++) {
		delete graph.edges[edgesToRemove[i]];
	}

	delete graph.nodes[nodeId];
};

GraphManager.prototype.generateRandomGraph = function(graph, directed, verticesCount, edgesCount, probability) {
	this.createEmptyGraph(graph, directed);

	for (var v = 0; v < verticesCount; v++) {
		var id = this.addNode(graph);
		EventBus.publish("add-node", id, 
							 	 	 500,
							 	 	 500,
							 	 	 30);
	}

	for (var e = 1; e <= edgesCount; e++) {
		var p = Math.random();
		if (p < probability) {
			var firstNodeId = Math.ceil(verticesCount / Math.ceil(p *e));
			var secondNodeId = (Math.ceil(p *e) % verticesCount) + 1;
			this.addEdge(graph, firstNodeId, secondNodeId, ~~(p * 100) + 1); // Magic
			EventBus.publish("add-edge");
		}
	}
};