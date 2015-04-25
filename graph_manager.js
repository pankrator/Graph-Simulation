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

GraphManager.prototype.createEmptyGraph = function () {
	return {
		directed: false,
		nodes: {},
		edges: {}
	};
};

GraphManager.prototype.addNode = function (graph) {
	graph.nodes[++this.nodeCounter] = {
		id: this.nodeCounter,
		edges: {}
	};

	return this.nodeCounter;
	// EventBus.publish("add-node", this.nodeCounter);
	// graph.nodeSpeed = 20;
};


GraphManager.prototype.addEdge = function (graph, first, second, weight) {
	var edge = createEdge(first, second, weight);
	graph.edges[edge.id] = edge;
	EventBus.publish("add-edge", edge.id);

	if (GraphUtil.isDirected(graph)) {
		graph.nodes[first].edges.push(edge.id);
	} else {
		var revertEdge = createEdge(second, first, weight);
		graph.edges[revertEdge.id] = edge;
		EventBus.publish("add-edge", revertEdge.id);

		graph.nodes[first].edges.push(edge.id);
		graph.nodes[second].edges.push(revertEdge.id);
	}
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