var NODE_SPEED = 20;

var ForceBasedController = function (graph) {
	this.graph = graph;
	this.graph.transformations = {};
	this.graph.nodeSpeed = NODE_SPEED;

	EventBus.subscribe("add-node", this.addNode.bind(this));
	EventBus.subscribe("add-edge", this.addEdge.bind(this));
};

ForceBasedController.prototype.addEdge = function() {
	this.graph.nodeSpeed = NODE_SPEED;
}

ForceBasedController.prototype.addNode = function (id, x, y, radius) {
	this.graph.transformations[id] = {
		id: id,
		x: x,
		y: y,
		radius: radius
	};

	this.graph.nodeSpeed = NODE_SPEED;
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

ForceBasedController.prototype.attractToNeighbours = function(node) {
	for (var i = 0; i < node.edges.length; i++) {
		var edge = this.graph.edges[node.edges[i]];
		var transformationFrom = this.graph.transformations[edge.from];
		var transformationTo = this.graph.transformations[edge.to];
		var dir = {
			x: transformationFrom.x - transformationTo.x,
			y: transformationFrom.y - transformationTo.y,
		};

		var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
		if (len != 0) {
			dir.x /= len;
			dir.y /= len;
		}
		if (dir.x == 0 && dir.y == 0) {
			dir.x = Math.random() - Math.random();
			dir.y = Math.random() - Math.random();
		}

		var minDistance = transformationFrom.radius * 5 + 50;
		var scalenLen = 1/1000;

		if (len >= minDistance) {
			transformationFrom.x -= dir.x * this.graph.nodeSpeed * (len * scalenLen || 1);
			transformationFrom.y -= dir.y * this.graph.nodeSpeed * (len * scalenLen || 1);
		}
	}
}

ForceBasedController.prototype.repelFromUnrelated = function(nodeId) {
	var nodeTransformation = this.graph.transformations[nodeId];
	for (var id in this.graph.transformations) {
		var transformation = this.graph.transformations[id];
		if (nodeId == id) {
			continue;
		}

		var dir = {
			x: nodeTransformation.x - transformation.x,
			y: nodeTransformation.y - transformation.y,
		};

		var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
		if (len != 0) {
			dir.x /= len;
			dir.y /= len;
		}
		if (dir.x == 0 && dir.y == 0) {
			dir.x = Math.random();
			dir.y = Math.random();
		}

		var minDistance = transformation.radius * 4 + 50;
		var scaleLen = 1/8;

		if (len < minDistance) {
			transformation.x -= dir.x * this.graph.nodeSpeed / (len * scaleLen || 1);
			transformation.y -= dir.y * this.graph.nodeSpeed / (len * scaleLen || 1);
		}
	}
}

ForceBasedController.prototype.action = function (nodeId) {
	this.attractToNeighbours(this.graph.nodes[nodeId]);
	this.repelFromUnrelated(nodeId);
}

ForceBasedController.prototype.update = function () {
	for (var nodeId in this.graph.nodes) {
		this.action(nodeId);
	}

	this.graph.nodeSpeed *= 0.99;
	if(this.graph.nodeSpeed < 0.5) {
		this.graph.nodeSpeed = 0;
	}
}
