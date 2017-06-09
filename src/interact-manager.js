'use strict';

const UIState = require('./ui_state');
const constants = require('./constants');
const EventBus = require('./event-bus');
let selectionState = UIState.selectionState;

const InteractManager = function (controller, graphManager, graph, renderer, input) {
  this.controller = controller;
  this.graphManager = graphManager;
  this.graph = graph;
  this.renderer = renderer;
  this.input = input;

  this.state = {
    firstNode: null,
    secondNode: null,
    movingNode: null
  };
};

InteractManager.prototype.mouseUpFirst = function () {
  if (this.state.movingNode == null && this.state.firstNode == null && selectionState.tool === 'HAND') {
    let edge = this.controller.getEdge(this.input.mouse.x,
      this.input.mouse.y);
    if (edge != null) {
      this._showEdgeChangeDialog(edge);
    } else {
      this._createNode();
    }
  } else if (selectionState.tool === 'LINE' && this.state.firstNode != null) {
    this._addEdge();
  } else if (selectionState.tool === 'ITERATOR' && this.state.firstNode != null) {
  }
};

InteractManager.prototype._addEdge = function () {
  let firstNode = this.state.firstNode;
  let secondNode = this.controller.getNodeIdByCoordinates(this.input.mouse.x,
    this.input.mouse.y);

  if (secondNode != null) {
    this.renderer.lerpLine(this.graph.transformations[firstNode].x,
      this.graph.transformations[firstNode].y,
      this.graph.transformations[secondNode].x,
      this.graph.transformations[secondNode].y,
      "blue", 300, () => {
        this.graphManager.addEdge(this.graph, firstNode, secondNode, 1);
      });
  }
  this.renderer.stopPulseAnimation(firstNode);
  this.state.firstNode = null;
};

InteractManager.prototype.mouseUpSecond = function () {
  if (this.state.firstNode == null && selectionState.tool === 'HAND') {
    this._removeNode();
  }
};

InteractManager.prototype._removeNode = function () {
  var nodeToRemove = this.controller.getNodeIdByCoordinates(this.input.mouse.x, this.input.mouse.y);
  if (nodeToRemove != null) {
    this.graphManager.removeNode(this.graph, nodeToRemove);
    EventBus.publish("remove-node", nodeToRemove);
  }
};

InteractManager.prototype._createNode = function () {
  this.graphManager.addNode(this.graph, this.input.mouse.x, this.input.mouse.y, constants.DEFAULT_NODE_RADIUS);
};

InteractManager.prototype._showEdgeChangeDialog = function (edge) {
  const newEdgeSize = prompt("Tell me edge size", edge.weight);
  if (newEdgeSize) {
    if (!this.graph.directed) {
      let node = this.graph.nodes[edge.to];
      let index = _.findIndex(node.edges, (edgeId) => {
        return this.graph.edges[edgeId].to == edge.from;
      });
      let edgeId = node.edges[index];

      this.graph.edges[edgeId].weight = parseInt(newEdgeSize);
    }

    edge.weight = parseInt(newEdgeSize);
  }
};

InteractManager.prototype.resetState = function () {
  if (this.state.movingNode) {
    this.renderer.stopPulseAnimation(this.state.movingNode);
  }

  if (this.state.firstNode) {
    this.renderer.stopPulseAnimation(this.state.firstNode);
  }
  this.state = {};
}

InteractManager.prototype.selectNode = function () {
  const nodeId = this.controller.getNodeIdByCoordinates(this.input.mouse.x, this.input.mouse.y);

  if (nodeId !== null) {
    if (selectionState.tool === 'LINE') {
      this.state.firstNode = nodeId;
      this.renderer.playPulseAnimation(nodeId);
    } else if (selectionState.tool === 'HAND') {
      this.state.movingNode = nodeId;
      this.renderer.playPulseAnimation(nodeId);
    } else if (selectionState.tool === 'ITERATOR') {
      this.state.firstNode = nodeId;

      if (selectionState.waitForStartingNode && selectionState.waitForGoalNode) {
        selectionState.waitForStartingNode = false;
        selectionState.startNode = this.state.firstNode;
        return;
      }
      if (!selectionState.waitForStartingNode && selectionState.waitForGoalNode
        && selectionState.startNode) {
        selectionState.goalNode = this.state.firstNode;
        selectionState.waitForGoalNode = false;
        startIterator(selectionState.startNode, selectionState.goalNode);
        selectionState.startNode = null;
        selectionState.goalNode = null;
        return;
      }

      startIterator(this.state.firstNode);
    }
  }
};

const startIterator = (nodeId, secondId) => {
  if (selectionState.tool === 'ITERATOR') {
    if (selectionState.waitForGoalNode) {
      return;
    }
    selectionState.iterator.start(nodeId, secondId);
    selectionState.waitForStartingNode = false;
  }
};

InteractManager.prototype.update = function () {
  if (this.state.firstNode && selectionState.tool === 'LINE') {
    this.renderer.renderLine(
      this.controller.getCircleCoordinatesOnNode(this.input.mouse.x,
        this.input.mouse.y,
        this.state.firstNode),
      {
        x: this.input.mouse.x,
        y: this.input.mouse.y
      }, 'red');
  }

  const movingNode = this.state.movingNode;

  if (movingNode && selectionState.tool === 'HAND') {
		this.graph.transformations[movingNode].x = this.input.mouse.x;
		this.graph.transformations[movingNode].y = this.input.mouse.y;
    this.graph.nodeSpeed = 20;
	}
};

module.exports = InteractManager;
