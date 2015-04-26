var NODE_SPEED = 20;

var ForceBasedController = function (graph, left, top, height, width) {
	this.graph = graph;
	this.graph.transformations = {};
	this.graph.nodeSpeed = NODE_SPEED;
	this.left = left;
	this.top = top;
	this.height = height;
	this.width = width;

	EventBus.subscribe("add-node", this.addNode.bind(this));
	EventBus.subscribe("add-edge", this.addEdge.bind(this));
	EventBus.subscribe("remove-node", this.removeNode.bind(this));
};

ForceBasedController.prototype.removeNode = function(nodeId) {
	delete this.graph.transformations[nodeId];
	this.graph.nodeSpeed = NODE_SPEED;
};

ForceBasedController.prototype.addEdge = function() {
	this.graph.nodeSpeed = NODE_SPEED;
};

ForceBasedController.prototype.addNode = function (id, x, y, radius) {
	this.graph.transformations[id] = {
		id: id,
		x: x,
		y: y,
		radius: radius
	};

	this.graph.nodeSpeed = NODE_SPEED;
};

ForceBasedController.prototype.getEdgeWeight = function (x, y) {
	for (var edgeId in this.graph.edges) {
		var edge = this.graph.edges[edgeId];
		var node1 = this.graph.transformations[edge.from];
		var node2 = this.graph.transformations[edge.to];

		var numberPosition = {
			x: (node1.x + node2.x) / 2,
			y: (node1.y + node2.y) / 2 - 20
		};
		var dir = {
			x: x - numberPosition.x,
			y: y - numberPosition.y
		};
		var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);

		if (len <= 20) {
			return edge;
		}
	}

	return null;
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
};

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
};

ForceBasedController.prototype.repelFromDimensions = function(nodeId) {
	var nodeTransformation = this.graph.transformations[nodeId];

	var transformationLeft = nodeTransformation.x;
	var transformationRight = this.width - nodeTransformation.x;
	var transformationtop = nodeTransformation.y;
	var transformationbottom = this.height - nodeTransformation.y;

	var minDistance = nodeTransformation.radius * 4 + 50;
	var scaleLen = 1/8;

	if (transformationLeft < minDistance + this.left) {
		nodeTransformation.x += this.graph.nodeSpeed / (transformationLeft * scaleLen || 1);
	} else if (transformationRight < minDistance) {
		nodeTransformation.x -= this.graph.nodeSpeed / (transformationRight * scaleLen || 1);
	} 

	if (transformationtop < minDistance + this.top) {
		nodeTransformation.y += this.graph.nodeSpeed / (transformationtop * scaleLen || 1);
	} else if  (transformationbottom < minDistance) {
		nodeTransformation.y -= this.graph.nodeSpeed / (transformationbottom * scaleLen || 1);
	}
};

ForceBasedController.prototype.action = function (nodeId) {
	this.attractToNeighbours(this.graph.nodes[nodeId]);
	this.repelFromUnrelated(nodeId);
	this.repelFromDimensions(nodeId);
};

ForceBasedController.prototype.update = function () {
	for (var nodeId in this.graph.nodes) {
		this.action(nodeId);
	}

	if (movingNode) {
		this.graph.nodeSpeed = NODE_SPEED;
	}

	this.graph.nodeSpeed *= 0.99;
	if(this.graph.nodeSpeed < 0.5) {
		this.graph.nodeSpeed = 0;
	}
};
