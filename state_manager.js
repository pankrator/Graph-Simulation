var StateManager = function (graph) {
	this.graph = graph;
	this.graph.states = {};

	EventBus.subscribe("add-node", this.nodeClicked.bind(this));
};

StateManager.prototype.nodeClicked = function (nodeId) {
	if (!this.graph.states[nodeId]) {
		this.graph.states[nodeId] = {};
	}
}