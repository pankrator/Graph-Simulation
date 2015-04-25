var VISITED_FILL_STYLE = "black";
var NORMAL_STROKE_STYLE = "black";
var NORMAL_FILL_STYLE = "blue";
var EDGE_STROKE_STYLE = "red";
var EDGE_WEIGHT_FILL_STYLE = "blue";

var Renderer = function (context, graph) {
	this.graph = graph;
	this.graph.animationStates = {};

	this.context = context;
	this.animations = [];

	EventBus.subscribe("add-node", this.addNode.bind(this));
	EventBus.subscribe("visit-node", this.visitNode.bind(this));
	EventBus.subscribe("node-selected", this.nodeSelected.bind(this));
	EventBus.subscribe("node-released", this.nodeReleased.bind(this));
};

Renderer.prototype.addNode = function (nodeId) {
	this.graph.animationStates[nodeId] = {
		color: NORMAL_STROKE_STYLE,
		fill: false,
		fillColor: NORMAL_FILL_STYLE
	};
}

Renderer.prototype.renderNodes = function () {
	for (var id in this.graph.nodes) {
		var node = this.graph.nodes[id];
		var transform = this.graph.transformations[id];
		var animationState = this.graph.animationStates[id];

		this.renderCircle(transform.x, transform.y,
						  transform.radius, 
						  animationState.color,
						  animationState.fill,
						  animationState.fillColor);

		this.renderEdges(node.edges);
	}
};

Renderer.prototype.renderEdges = function(edges) {
	for (var i = 0; i < edges.length; i++) {
		var edge = graph.edges[edge];
		
		context.strokeStyle = EDGE_STROKE_STYLE;
		var node1 = graph.transformations[edge.from];
		var node2 = graph.transformations[edge.to];

		if (!graph.directed) {
			context.beginPath();
			var dir = {
				x: node1.x - node2.x,
				y: node1.y - node2.y
			};
			var len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
			if (len != 0) {
				dir.x /= len;
				dir.y /= len;
			}

			context.moveTo(node1.x + (-1) * dir.x * node1.radius,
			 			   node1.y + (-1) * dir.y * node1.radius);
			context.lineTo(node2.x + dir.x * node2.radius,
						   node2.y + dir.y * node2.radius);
			context.stroke();

			context.fillStyle = EDGE_WEIGHT_FILL_STYLE;
			context.fillText(edge.weight, 
							 Math.abs(node1.x - node2.x) / 2,
							 Math.abs(node1.y - node2.y) / 2 - 20); // Magic

			// if (list[i].level) {
			// 	context.fillStyle = "blue";
			// 	context.fillText((list[i].level - 1) + " steps", list[i].x - 10, list[i].y - list[i].radius - 10);
			// }
		}
	}
};

Renderer.prototype.renderCircle = function (x, y, radius,
											outlineColor,
											isFilled,
											fillColor) {
	this.context.beginPath();
	if (isFilled) {
		context.fillStyle = fillColor;
		context.arc(x, y, radius, 0, Math.PI * 2);
		context.fill();
	} else {
		context.strokeStyle = outlineColor;
		context.arc(x, y, radius, 0, Math.PI * 2);
		context.stroke();
	}
}

Renderer.prototype.renderLine = function (from, to, color) {
	this.context.beginPath();
	this.context.strokeStyle = color;

	this.context.moveTo(from.x, from.y);
	this.context.lineTo(to.x, to.y);

	this.context.stroke();
};

Renderer.prototype.visitNode = function (nodeId) {
	var animationState = this.graph.animationStates[nodeId];

	animationState.fill = true;
	animationState.fillColor = VISITED_FILL_STYLE;
};

Renderer.prototype.nodeReleased = function (nodeId) {
	this.graph.animationStates[nodeId].selected = false;
};

Renderer.prototype.nodeSelected = function (nodeId) {
	if (!this.graph.animationStates[nodeId]) {
		this.graph.animationStates[nodeId] = {};
	}
	var animationState = this.graph.animationStates[nodeId];

	if (animationState.selected) {
		return; // Prevent from double attaching animation
	}

	var currentAnimState = {};
	for (var key in animationState) {
		currentAnimState[key] = animationState[key];
	}

	animationState.selected = true;
	animationState.shrinking = false;

	this.animations.push(function(nodeId, prevAnimState) {
		var animationState = this.graph.animationStates[nodeId];
		var transform = this.graph.transformations[nodeId];

		transform.radius += animationState.shrinking ? -1 : 1;
		
		if (transform.radius < 25 && animationState.shrinking) {
			animationState.shrinking = false;
			animationState.fill = true;
		}
		if (transform.radius > 40 && !animationState.shrinking) {
			animationState.shrinking = true;
			animationState.fill = false;
		}

		if (!animationState.selected) {
			transform.radius = 30;
			this.graph.animationStates[nodeId] = prevAnimState;
		}

		return animationState.selected;
	}.bind(this, nodeId, currentAnimState));
};

Renderer.prototype.render = function () {
	this.renderNodes();

	for (var i = 0; i < this.animations.length; i++) {
		var result = this.animations[i]();
		if (!result) {
			this.animations.splice(i, 1);
		}
	}
};

Renderer.prototype.clear = function () {
	this.context.clearRect(0, 0, 1500, 2000);
}