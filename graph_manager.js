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
		edges: []
	};

	return this.nodeCounter;
	// EventBus.publish("add-node", this.nodeCounter);
	// graph.nodeSpeed = 20;
};


GraphManager.prototype.addEdge = function (graph, firstId, secondId, weight) {
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