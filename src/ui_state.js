'use strict';

let selectionState = {};
selectionState.firstNode = null;
selectionState.iterator = null;
selectionState.tool = "HAND";

let elements = {
	canvas: null,
	context: null
};

const initializeCanvasContext = () => {
	elements.canvas = document.getElementById("area");
	elements.context = elements.canvas.getContext("2d");
};

const attachUIListeners = function (handlers) {
	const notDirectedGraphButton = document.getElementById("not_directed_graph");
	const directedGraphButton = document.getElementById("directed_graph");
	const generateUndirectedGraphButton = document.getElementById("generate_not_directed_graph");
	const generateDirectedGraphButton = document.getElementById("generate_directed_graph");
	const BFSIteratorButton = document.getElementById("BFS");
	const DijkstraButton = document.getElementById("Dijkstra");
	const AStarButton = document.getElementById("AStar");
	const saveButton = document.getElementById("save");
	const loadButton = document.getElementById("load");

	notDirectedGraphButton.addEventListener("click", handlers.createNotDirectedGraph);
	directedGraphButton.addEventListener("click", handlers.createDirectedGraph);
	generateUndirectedGraphButton.addEventListener("click", handlers.generateNotDirectedGraph);
	generateDirectedGraphButton.addEventListener("click", handlers.generateDirectedGraph);

	BFSIteratorButton.addEventListener("click", handlers.handleBFSIterator);
	DijkstraButton.addEventListener("click", handlers.handleDijkstraIterator);
	AStarButton.addEventListener("click", handlers.handleAStarIterator);
	saveButton.addEventListener("click", handlers.handleSave);
	loadButton.addEventListener("click", handlers.handleLoad);

};

module.exports = {
	attachUIListeners,
	selectionState,
	initializeCanvasContext,
	elements
};
