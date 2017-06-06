var SEEN_NODE_COLOR = "green";
var FINISHED_NODE_COLOR = "black";
var ROOT_NODE_COLOR = "blue";
var NODE_PROPERTIES = [
	"x", "y", "outlineColor", "fillColor", "filled", "index",
	"neighbours", "radius"
];
var EDGE_PROPERTIES = [
	"index", "direction", "weight"
];
var DIRECTION = {
	IN: 1,
	OUT: 2,
	BIDIR: 3
};


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
	this.nodeProperties = NODE_PROPERTIES;
};


GraphManager.prototype.createEmptyGraph = function (graphController) {
	return {
		directed: false,
		list: [],
		freeIndexes: [],
		nodeSpeed: 20,
		drawConnections: true,
		graphController: graphController
	};
}

GraphManager.prototype.createDirectedGraph = function (graphController) {
	return {
		directed: true,
		list: [],
		freeIndexes: [],
		nodeSpeed: 20,
		drawConnections: true,
		graphController: graphController
	};
}

GraphManager.prototype.createEdge = function (graph, first, second, direction, weight) {
	if (GraphUtil.isDirected(graph)) {
		return {
			index: second.index,
			direction: direction,
			weight: weight != undefined ? weight : 0
		};
	} else {
		return {
			index: second.index,
			direction: DIRECTION.BIDIR,
			weight
		}
	}
}

GraphManager.prototype.setDrawConnections = function (graph, drawConnections) {
	graph.drawConnections = drawConnections;
}

GraphManager.prototype.draw = function (graph, context) {
	var list = graph.list;
	for (var i = 0; i < list.length; i++) {
		context.beginPath();
		if (list[i].fill) {
			context.fillStyle = list[i].color ? list[i].color : "white";
		} else {
			context.strokeStyle = list[i].color ? list[i].color : "blue";
		}
		context.arc(list[i].x, list[i].y, list[i].radius, 0, Math.PI * 2);

		if (list[i].fill) {
			context.fill();
		} else {
			context.stroke();
		}
		context.fillStyle = "red";
		context.fillText(i, list[i].x - 10, list[i].y);
		if (list[i].level) {
			context.fillStyle = "blue";
			context.fillText((list[i].level - 1) + " steps", list[i].x - 10, list[i].y - list[i].radius - 10);
		}

		if (graph.drawConnections) {
			context.strokeStyle = "red";
			var neighbours = list[i].neighbours;
			for (var j = 0; j < neighbours.length; j++) {
				context.beginPath();
				var other = list[neighbours[j]];
				var dir = {
					x: list[i].x - other.x,
					y: list[i].y - other.y
				};
				var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
				if (len != 0) {
					dir.x /= len;
					dir.y /= len;
				}

				context.moveTo(list[i].x + (-1) * dir.x * list[i].radius, list[i].y + (-1) * dir.y * list[i].radius);
				context.lineTo(other.x + dir.x * other.radius, other.y + dir.y * other.radius);
				context.stroke();
			}
		}
	}
}

GraphManager.prototype.getGraphNodeByCoordinates = function (graph, x, y) {
	var list = graph.list;
	for (var i = 0; i < list.length; i++) {
		var dir = {
			x: x - list[i].x,
			y: y - list[i].y
		};

		var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);

		if (len <= list[i].radius) {
			return list[i];
		}
	}

	return null;
}

GraphManager.prototype.getNodeCircleCoordinatesFromPosition = function (graph,
																	    node,
																	    x,
																	    y) {
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
}

GraphManager.prototype.initializeNodeNeighbours = function (graph) {
	var list = graph.list;

	for (var i = 0; i < list.length; i++) {
		var neighbours = list[i].neighbours;
		for (var j = 0; j < neighbours.length; j++) {
			var otherNeightbours = list[neighbours[j]].neighbours;
			var addFlag = true;
			for (var k = 0; k < otherNeightbours.length; k++) {
				if (otherNeightbours[k] == i) {
					addFlag = false;
					break;
				}
			}
			if (addFlag) {
				otherNeightbours.push(i);
			}
		}
	}
}

GraphManager.prototype.removeNodeOnCoordinates = function (graph, x, y) {
	var nodeObject = this.getGraphNodeByCoordinates(graph, x, y);
	if (nodeObject === null) {
		return;
	}

	var node = nodeObject;
	var nodeIndex = nodeObject.index;
	var list = graph.list;
	for (var i = 0; i < node.neighbours.length; i++) {
		var removeIndex = list[node.neighbours[i]].neighbours.indexOf(nodeIndex);
		list[node.neighbours[i]].neighbours.splice(removeIndex, 1);
	}
	list[nodeIndex].neighbours = [];
	// {index: 4, dir: "in/out"}
	list[nodeIndex].disabled = true;
	graph.freeIndexes.push(nodeIndex);
}

GraphManager.prototype.addNode = function (graph, x, y) {
	var freeIndex = graph.freeIndexes.pop();
	if (freeIndex === undefined) {
		graph.list.push(this.createNode({
			x: x,
			y: y,
			index: graph.list.length,
			radius: 30,
		 	neighbours: []
		}));
	} else {
		graph.list[freeIndex] = this.createNode({
			x: x,
			y: y,
			index: freeIndex,
			radius: 30,
			neighbours: []
		});
	}

	graph.nodeSpeed = 20;
}

GraphManager.prototype.createNode = function (properties) {
	var node = {};
	this.nodeProperties.forEach(function (prop) {
		if (properties[prop] !== undefined && properties[prop] != null) {
			node[prop] = properties[prop];
		} else {
			node[prop] = null;
		}
	});

	return node;
}

GraphManager.prototype.connectNodes = function (graph, first, second) {
	if (GraphUtil.isDirected(graph)) {
		first.neighbours.push(second.index);
	} else {
		first.neighbours.push(second.index);
		second.neighbours.push(first.index);
	}
	// May be use an Event drive approch to say that node is added
	graph.nodeSpeed = 20;
}

GraphManager.prototype.connectNodesByIndex = function (graph, firstIndex, secondIndex) {
	var first = graph.list[firstIndex];
	var second = graph.list[secondIndex];

	this.connectNodes(graph, first, second);
}

GraphManager.prototype.simulate = function (graph) {
	if (graph.nodeSpeed < 0.5) {
		return;
	}

	var controller = graph.graphController;
	for (var i = 0; i < graph.list.length; i++) {
		if (!graph.list[i].disabled) {
			graph.list[i]["index"] = i;
			controller.action(graph.list[i], graph.list[i].neighbours, graph);
		}
	}
	graph.nodeSpeed *= 0.99;
}

var ForceBasedGraphController = function () {};

ForceBasedGraphController.prototype.initialization = function (graph) {}

ForceBasedGraphController.prototype.action = function (node, neighbours, graph) {
	var list = graph.list;

	for (var j = 0; j < neighbours.length; j++) {
		var dir = {
			x: node.x - list[neighbours[j]].x,
			y: node.y - list[neighbours[j]].y,
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

		var minDistance = node.radius * 5 + 50;
		var scalenLen = 1/1000;

		if (len >= minDistance) {
			node.x -= dir.x * graph.nodeSpeed * (len * scalenLen || 1);
			node.y -= dir.y * graph.nodeSpeed * (len * scalenLen || 1);
		}
	}

	for (var i = 0; i < list.length; i++) {
		if (node.index == i) {
			continue;
		}

		var dir = {
			x: node.x - list[i].x,
			y: node.y - list[i].y,
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

		var minDistance = list[i].radius * 4 + 50;
		var scaleLen = 1/8;

		if (len < minDistance) {
			list[i].x -= dir.x * graph.nodeSpeed / (len * scaleLen || 1);
			list[i].y -= dir.y * graph.nodeSpeed / (len * scaleLen || 1);
		}
	}
}
