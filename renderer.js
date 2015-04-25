var VISITED_FILL_STYLE = "black";
var NORMAL_STROKE_STYLE = "black";
var NORMAL_FILL_STYLE = "blue";
var EDGE_STROKE_STYLE = "red";
var EDGE_WEIGHT_FILL_STYLE = "blue";

var ARROW_LENGTH = 20;

var Renderer = function (context, graph) {
	this.graph = graph;
	this.graph.animationStates = {};

	this.context = context;
	this.animations = [];

	EventBus.subscribe("add-node", this.addNode.bind(this));
	EventBus.subscribe("visit-node", this.visitNode.bind(this));
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
		var edge = this.graph.edges[edges[i]];
		
		context.strokeStyle = EDGE_STROKE_STYLE;
		var node1 = this.graph.transformations[edge.from];
		var node2 = this.graph.transformations[edge.to];

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

		this.renderLine({
			x: node1.x + (-1) * dir.x * node1.radius,
			y: node1.y + (-1) * dir.y * node1.radius
		}, {
			x: node2.x + dir.x * node2.radius,
			y: node2.y + dir.y * node2.radius
		}, EDGE_STROKE_STYLE);

		if (edge.weight !== 0) {
			context.fillStyle = EDGE_WEIGHT_FILL_STYLE;
			context.fillText(edge.weight, 
							 (node1.x + node2.x) / 2,
							 (node1.y + node2.y) / 2 - 20); // Magic
		}

		// if (list[i].level) {
		// 	context.fillStyle = "blue";
		// 	context.fillText((list[i].level - 1) + " steps", list[i].x - 10, list[i].y - list[i].radius - 10);
		// }

		if (this.graph.directed) {
			var point1 = {
				x: ((node2.x + dir.x * node2.radius) + (dir.x) * ARROW_LENGTH) + (-dir.y * ARROW_LENGTH),
				y: ((node2.y + dir.y * node2.radius) + (dir.y) * ARROW_LENGTH) + (dir.x * ARROW_LENGTH)
			};

			var point2 = {
				x: ((node2.x + dir.x * node2.radius) + (dir.x) * ARROW_LENGTH) + (dir.y * ARROW_LENGTH),
				y: ((node2.y + dir.y * node2.radius) + (dir.y) * ARROW_LENGTH) + (-dir.x * ARROW_LENGTH)
			};

			this.renderLine({
				x: node2.x + dir.x * node2.radius,
				y: node2.y + dir.y * node2.radius
			}, point1, EDGE_STROKE_STYLE);

			this.renderLine({
				x: node2.x + dir.x * node2.radius,
				y: node2.y + dir.y * node2.radius
			}, point2, EDGE_STROKE_STYLE);
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

Renderer.prototype.stopPulseAnimation = function (nodeId) {
	this.graph.animationStates[nodeId].pulsePlaying = false;
};

Renderer.prototype.playPulseAnimation = function (nodeId) {
	var animationState = this.graph.animationStates[nodeId];
	var transform = this.graph.transformations[nodeId];

	if (animationState.pulsePlaying) {
		return; // Prevent from double attaching animation
	}

	var prevAnimationState = {};
	for (var key in animationState) {
		prevAnimationState[key] = animationState[key];
	}

	animationState.pulsePlaying = true;

	this.animations.push(function(transform, animationState, prevAnimationState) {
		transform.radius += animationState.shrinking ? -1 : 1;
		
		if (transform.radius < 25 && animationState.shrinking) {
			animationState.shrinking = false;
			animationState.fill = true;
		}
		if (transform.radius > 40 && !animationState.shrinking) {
			animationState.shrinking = true;
			animationState.fill = false;
		}

		if (!animationState.pulsePlaying) {
			transform.radius = 30;
			animationState.fill = prevAnimationState.fill;
		}

		return animationState.pulsePlaying;
	}.bind(this, transform, animationState, prevAnimationState));
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