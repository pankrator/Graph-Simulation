'use strict';

const EventBus = require('./event-bus');
const constants = require('./constants');

var Renderer = function (context, graph) {
	this.graph = graph;
	this.graph.animationStates = {};

	this.context = context;
	this.animations = [];
};

Renderer.prototype.renderNodes = function () {
	for (var id in this.graph.nodes) {
		var node = this.graph.nodes[id];
		var transform = this.graph.transformations[id];
		var animationState = this.graph.animationStates[id];

		var state = this.graph.states[id];


		this.renderCircle(transform.x, transform.y,
						  transform.radius,
						  animationState.color,
						  animationState.fill,
						  animationState.fillColor);

		if (state.level || state.level == 0) {
			this.renderText(transform.x, transform.y,
							state.level, constants.LEVEL_FONT_COLOR);
		}

		if (state.distance) {
			this.renderText(transform.x, transform.y,
							state.distance != Infinity ? (state.distance) :
							"∞", constants.DISTANCE_FONT_COLOR);
		}

		this.renderEdges(node.edges);
	}
};

Renderer.prototype.renderEdges = function(edges) {
	for (var i = 0; i < edges.length; i++) {
		var edge = this.graph.edges[edges[i]];

		this.context.strokeStyle = constants.EDGE_STROKE_STYLE;
		var node1 = this.graph.transformations[edge.from];
		var node2 = this.graph.transformations[edge.to];

		this.context.beginPath();
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
		}, constants.EDGE_STROKE_STYLE, constants.LINE_WIDTH);

		if (edge.weight !== 0) {
			this.context.font = constants.DEFAULT_FONT;
			this.context.fillStyle = constants.EDGE_WEIGHT_FILL_STYLE;
			this.context.fillText(edge.weight,
							 (node1.x + node2.x) / 2,
							 (node1.y + node2.y) / 2 - 5); // Magic

		}

		// if (list[i].level) {
		// 	context.fillStyle = "blue";
		// 	context.fillText((list[i].level - 1) + " steps", list[i].x - 10, list[i].y - list[i].radius - 10);
		// }

		if (this.graph.directed) {
			var point1 = {
				x: ((node2.x + dir.x * node2.radius) + (dir.x) * constants.ARROW_LENGTH) + (-dir.y * constants.ARROW_LENGTH),
				y: ((node2.y + dir.y * node2.radius) + (dir.y) * constants.ARROW_LENGTH) + (dir.x * constants.ARROW_LENGTH)
			};

			var point2 = {
				x: ((node2.x + dir.x * node2.radius) + (dir.x) * constants.ARROW_LENGTH) + (dir.y * constants.ARROW_LENGTH),
				y: ((node2.y + dir.y * node2.radius) + (dir.y) * constants.ARROW_LENGTH) + (-dir.x * constants.ARROW_LENGTH)
			};

			this.renderLine({
				x: node2.x + dir.x * node2.radius,
				y: node2.y + dir.y * node2.radius
			}, point1, constants.EDGE_STROKE_STYLE, constants.LINE_WIDTH);

			this.renderLine({
				x: node2.x + dir.x * node2.radius,
				y: node2.y + dir.y * node2.radius
			}, point2, constants.EDGE_STROKE_STYLE, constants.LINE_WIDTH);
		}
	}
};

Renderer.prototype.renderText = function (x, y, text, color) {
	this.context.font = constants.DEFAULT_FONT;
	this.context.fillStyle = color  ? color : "blue";
	this.context.fillText(text, x, y);
}

Renderer.prototype.renderCircle = function (x, y, radius,
											outlineColor,
											isFilled,
											fillColor,
											lineWidth) {
	this.context.beginPath();
	this.context.lineWidth = lineWidth ? lineWidth : constants.LINE_WIDTH;
	this.context.fillStyle = fillColor;
	this.context.strokeStyle = outlineColor;

	this.context.arc(x, y, radius, 0, Math.PI * 2);
	if (isFilled) {
		this.context.fill();
	}
	this.context.stroke();
}

Renderer.prototype.renderLine = function (from, to, color, lineWidth) {
	this.context.beginPath();
	this.context.lineWidth = lineWidth ? lineWidth : constants.LINE_WIDTH;
	this.context.strokeStyle = color;

	this.context.moveTo(from.x, from.y);
	this.context.lineTo(to.x, to.y);

	this.context.stroke();
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
			transform.radius = constants.DEFAULT_NODE_RADIUS;
			animationState.fill = prevAnimationState.fill;
		}

		return animationState.pulsePlaying;
	}.bind(this, transform, animationState, prevAnimationState));
};

Renderer.prototype.lerpLine = function (fromX, fromY, toX, toY, color, finishTime, callback) {
	var animationTime = finishTime / 60;
	var state = {
		from: {
			x: fromX,
			y: fromY
		},
		to : {
			x: toX,
			y: toY
		},
		dir: {
			x: toX - fromX,
			y: toY - fromY
		},
		currentPos: {
			x: fromX,
			y: fromY
		},
		movePerStep: 30
	};

	var len = Math.sqrt(state.dir.x * state.dir.x + state.dir.y * state.dir.y);
	state.dir.x /= len;
	state.dir.y /= len;
	state.len = len;
	state.movePerStep = len / animationTime;

	this.animations.push(function (state, callback) {
		state.currentPos.x += state.dir.x * state.movePerStep;
		state.currentPos.y += state.dir.y * state.movePerStep;

		var currentLength = Math.sqrt((state.currentPos.x - state.from.x) *
									  (state.currentPos.x - state.from.x) +
									  (state.currentPos.y - state.from.y) *
									  (state.currentPos.y - state.from.y));

		this.renderLine(state.from, state.currentPos, color, constants.LINE_WIDTH);

		if (currentLength - state.len > 0) {
			if (typeof callback == "function") {
				callback();
			}
			return false;
		}

		return true;
	}.bind(this, state, callback));
}

Renderer.prototype.renderProgressBar = function (x, y, width, height, filledAmount, maximumAmount) {
	this.context.beginPath();

	//Outline rectangle
	this.context.fillStyle = constants.PROGRESS_BAR_BACKGROUND;
	this.context.strokeStyle = constants.PROGRESS_BAR_OUTLINE;

	this.context.rect(x, y, width, height);
	this.context.fill();
	this.context.stroke();

	//Filling rectangle
	this.context.beginPath();
	this.context.fillStyle = constants.PROGRESS_BAR_FILLING;
	var filledRatio = (filledAmount / maximumAmount);
	this.context.rect(x, y, width * filledRatio, height);
	this.context.fill();

	var offset = 0;
	var stepX = width / maximumAmount;
	for (var i = 0; i < maximumAmount; i++) {
		this.renderLine({x: x + offset, y: y}, {x: x +offset + 5, y: y + height}, "black");
		offset += stepX;
	}
}

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

module.exports = Renderer;