var ForceBasedController = function (graph) {
	this.graph = graph;
	this.graph.transformations = {};

	EventBus.subscribe("add-node", this.addNode.bind(this));
};

ForceBasedController.prototype.addNode = function (id, x, y, radius) {
	this.graph.transformations[id] = {
		id: id,
		x: x,
		y: y,
		radius: radius
	};
};

ForceBasedController.prototype.getNodeIdByCoordinates = function (x, y) {
	for (var id in this.graph.transformations) {
		var node = this.graph.transformations[id];

		var dir = {
			x: x - node.x,
			y: y - node.y
		};
		var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);

		if (len <= node.radius) {
			return id;
		}
	}

	return null;
};

ForceBasedController.prototype.getCircleCoordinatesOnNode = function (x, y, nodeId) {
	var node = this.graph.transformations[nodeId];

	var dir = {
		x: x - node.x,
		y: y - node.y
	};
	var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
	if (len != 0) {
		dir.x /= len;
		dir.y /= len;
	}

	var result = {
		x: node.x + dir.x * node.radius,
		y: node.y + dir.y * node.radius
	};
	return result;
};

ForceBasedController.prototype.update = function () {
	// for (var id in this.graph.transformations) {
		// this.graph.
		// this.action(this.graph.nodes[id])
	// }
}

ForceBasedController.prototype.action = function (node) {

}