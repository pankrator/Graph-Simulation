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

GraphManager.prototype.createEmptyGraph = function (graph, directed) {
	graph.directed = directed;
	graph.nodes = {};
	graph.edges = {};
};

GraphManager.prototype.addNode = function (graph) {
	graph.nodes[++this.nodeCounter] = {
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
		id: ++this.edgeCounter,
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