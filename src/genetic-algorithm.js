var KEEP_OFFSET = 80;
var ELITISM_OFFSET = 10;
var MUTATE_RATE = 0.75;
var MAX_NUMBER_SAMES = 4;

var Population = function () {
	this.individuals = [];
	this.numberOfSames = 0;
	this.bestIndividual = null;
}

Population.CHECK_NODE_INTERSECTION = true;
Population.CHECK_NODE_TO_EDGE_INTERSECTION = true;
Population.CHECK_ZERO_INTERSECTIONS = true;
Population.MAX_SIZE = 300;
Population.MIN_EVOLVE_TIMES = 50;

Population.prototype.addIndividual = function (individual) {
	this.individuals.push(individual);
	this.numberOfNodes = _.values(this.individuals[0].transformations).length;
}

Population.generateRandomGraph = function (graph) {
	var numberOfNodes = _.values(graph.transformations).length;
	var gridManager = new GridPartitioner({ x: DEFAULT_NODE_RADIUS * 2, y: DEFAULT_NODE_RADIUS * 2 }, { x: 1440, y: 900 }, DEFAULT_NODE_RADIUS * 2);
	var resultGraph = _.cloneDeep(graph);
	var transformations = resultGraph.transformations;
	for (var nodeId in transformations) {
		var nodeTransformation = transformations[nodeId];
		var freePlace = gridManager.getFreePlace();
		nodeTransformation.x = freePlace.col * nodeTransformation.radius * 2 + nodeTransformation.radius;
		nodeTransformation.y = freePlace.row * nodeTransformation.radius * 2 + nodeTransformation.radius;
	}

	return resultGraph;
}

Population.isGraphAltered = function (individual, iterationNumber) {
	var overlappingNodes = individual.overlappingNodes;
	if (individual.farFromNeighbours == individual.overlappingNodes) {
		overlappingNodes = 0;
	}

	if (Population.CHECK_ZERO_INTERSECTIONS) {
		return overlappingNodes == 0 && individual.overlappingNodeWithEdge == 0 && individual.intersections <= 8;
	}
	return ((iterationNumber > Population.MIN_EVOLVE_TIMES && 
			overlappingNodes < 1 && individual.overlappingNodeWithEdge <= 0) ||
			(overlappingNodes == 0 && individual.overlappingNodeWithEdge == 0 && individual.intersections == 0));
}

Population.prototype.getBestIndividual = function () {
	return this.bestIndividual;
}

Population.prototype.evolvePopulation = function () {
	this.evaluateIndividuals();
	
	// if (this.individuals[0].overlappingNodes <= 4) {
	// 	if (this.individuals[0].overlappingNodeWithEdge < 8) {
	// 		this.individuals.sort(function (a, b) {
	// 			if (a.overlappingNodes >= b.overlappingNodes) {
	// 				return a.overlappingNodes - b.overlappingNodes;
	// 			} else {
	// 				if (a.overlappingNodeWithEdge >= b.overlappingNodeWithEdge) {
	// 					return a.overlappingNodeWithEdge - b.overlappingNodeWithEdge;
	// 				} else {
	// 					return a.intersections - b.intersections;
	// 				}
	// 			}
	// 		});
	// 	} else {
	// 		this.individuals.sort(function (a, b) {
	// 			if (a.overlappingNodes >= b.overlappingNodes) {
	// 				return a.overlappingNodes - b.overlappingNodes;
	// 			} else {
	// 				return a.overlappingNodeWithEdge - b.overlappingNodeWithEdge;
	// 			}
	// 		});
	// 	}
	// } else {
	// 	this.individuals.sort(function (a, b) {
	// 		return a.overlappingNodes - b.overlappingNodes;
	// 	});
	// }

	this.individuals.sort(function (a, b) {
		if (a.overlappingNodes > b.overlappingNodes) {
			return a.overlappingNodes - b.overlappingNodes;
		} else {
			if (a.overlappingNodeWithEdge > b.overlappingNodeWithEdge) {
				return a.overlappingNodeWithEdge - b.overlappingNodeWithEdge;
			} else {
				return a.intersections - b.intersections;
			}
		}
	});


	// if (this.bestIndividual == this.individuals[0]) {
	// 	this.numberOfSames++;
	// 	if (this.numberOfSames >= MAX_NUMBER_SAMES) {
	// 		this.mutate(this.individuals[0]);
	// 		this.numberOfSames = 0;
	// 	}
	// }
	this.bestIndividual = this.individuals[0];

	for (var i = KEEP_OFFSET; i < this.individuals.length; i++) {
		var firstParentIndex = Math.floor(Math.random() * (KEEP_OFFSET - 1) + 1);
		var secondParentIndex = Math.floor(Math.random() * (KEEP_OFFSET - 1) + 1);
		while (secondParentIndex == firstParentIndex) {
			secondParentIndex = Math.floor(Math.random() * (KEEP_OFFSET - 1) + 1);
		}
		var child = this.crossover(firstParentIndex, secondParentIndex);
		this.individuals[i] = child;
	}

	for (var i = ELITISM_OFFSET; i < this.individuals.length; i++) {
		this.individuals[i] = this.mutateNew(this.individuals[i], false);
	}

	var newIndividual = this.mutateNew(this.individuals[0], true);
	this.individuals[Population.MAX_SIZE - 1] = newIndividual;
}

Population.prototype.crossover = function (first, second) {
	var parent1 = this.individuals[first].transformations;
	var parent2 = this.individuals[second].transformations;

	var child = _.cloneDeep(this.individuals[first]);
	var childTransformations = child.transformations;

	var startIndex = Math.floor(Math.random() * (Object.keys(parent1).length - 1) + 1);
	var endIndex = Math.floor(Math.random() * (Object.keys(parent2).length - 1) + 1);
	if (endIndex < startIndex) {
		var tmp = startIndex;
		startIndex = endIndex;
		endIndex = tmp;
	}

	for (var i = startIndex; i <= endIndex; i++) {
		childTransformations[i].x = parent1[i].x;
		childTransformations[i].y = parent1[i].y;
	}

	for (var i in parent2) {
		if (parseInt(i) >= startIndex && parseInt(i) <= endIndex) {
			continue;
		}
		childTransformations[i].x = parent2[i].x;
		childTransformations[i].y = parent2[i].y;
	}



	return child;
}

Population.prototype.mutateNew = function (individual, needsClone) {
	if (Math.random() > MUTATE_RATE) {
		return individual;
	}
	if (needsClone) {
		individual = _.cloneDeep(individual);
	}

	var nodeIds = null;
	if (individual.intersectedNodeToNode.length > 0) {
		nodeIds = individual.intersectedNodeToNode;
	} else if (individual.intersectedNodes.length > 0) {
		nodeIds = individual.intersectedNodes;
	} else if (individual.nodesToMove) {
		nodeIds = individual.nodesToMove;
	}

	if (nodeIds != null) {
		var gridManager = new GridPartitioner({ x: DEFAULT_NODE_RADIUS * 2, y: DEFAULT_NODE_RADIUS * 2 }, { x: 1440, y: 640 }, DEFAULT_NODE_RADIUS * 2);
		gridManager.reinitialize(individual);

		for (var i = 0; i < nodeIds.length; i++) {
			// if (Math.random() < MUTATE_RATE) {
				var nodeTransformation = individual.transformations[nodeIds[i]];
				var freePlace = gridManager.getFreePlace();
				gridManager.removeFrom(Math.floor(nodeTransformation.x / (nodeTransformation.radius * 2)), Math.floor(nodeTransformation.y / (nodeTransformation.radius * 2)));
				nodeTransformation.x = freePlace.col * nodeTransformation.radius * 2 + nodeTransformation.radius;
				nodeTransformation.y = freePlace.row * nodeTransformation.radius * 2 + nodeTransformation.radius;
			// }
		}
	} else {
		this.mutate(individual);	
	}

	return individual;
}

Population.prototype.mutate = function (individual) {
	if (Math.random() < MUTATE_RATE) {
		var gridManager = new GridPartitioner({ x: DEFAULT_NODE_RADIUS * 2, y: DEFAULT_NODE_RADIUS * 2 }, { x: 1440, y: 640 }, DEFAULT_NODE_RADIUS * 2);
		gridManager.reinitialize(individual);

		var transformations = individual.transformations;
		var begin = Math.floor(Math.random() * (this.numberOfNodes - 1) + 1);
		var end = Math.floor(Math.random() * (this.numberOfNodes - 1) + 1);
		while (end < begin) {
			end = Math.floor(Math.random() * (this.numberOfNodes - 1) + 1);
		}
		for (var i = begin; i <= end; i++) {
			var nodeTransformation = transformations[i];
			var freePlace = gridManager.getFreePlace();
			gridManager.removeFrom(Math.floor(nodeTransformation.x / (nodeTransformation.radius * 2)), Math.floor(nodeTransformation.y / (nodeTransformation.radius * 2)));
			nodeTransformation.x = freePlace.col * nodeTransformation.radius * 2 + nodeTransformation.radius;
			nodeTransformation.y = freePlace.row * nodeTransformation.radius * 2 + nodeTransformation.radius;
		}
	}
}

Population.prototype.evaluateIndividuals = function () {
	for (var i = 0; i < this.individuals.length; i++) {
		this.countIntersections(this.individuals[i]);
	}
}

Population.countNodeToEdgeIntersections = function (edge, individual) {
	var count = 0;
	var transformations = individual.transformations;
	for (var nodeId in transformations) {
		if (edge.to == nodeId || edge.from == nodeId) {
			continue;
		}

		var nodeCircle = transformations[nodeId];
		var isIntersecting = circleToRayIntersection({
			x: transformations[edge.from].x,
			y: transformations[edge.from].y
		}, {
			x: transformations[edge.to].x,
			y: transformations[edge.to].y
		}, {
			x: nodeCircle.x,
			y: nodeCircle.y,
		}, nodeCircle.radius);

		if (isIntersecting) {
			count++;
		}
	}

	return count;
}

Population.prototype.countIntersections = function (individual) {
	individual.intersections = 0;
	individual.overlappingNodes = 0;
	individual.overlappingNodeWithEdge = 0;
	individual.farFromNeighbours = 0;
	individual.closeToNeighbours = 0;

	individual.intersectedNodes = [];
	individual.intersectedNodeToNode = [];
	individual.nodesToMove = [];

	var transformations = individual.transformations;
	var edges = _.values(individual.edges);

	for (var i = 0; i < edges.length - 1; i++) {
		var v1 = edges[i].from;
		var v2 = edges[i].to;

		if (Population.CHECK_NODE_TO_EDGE_INTERSECTION) {
			for (var nodeId in transformations) {
				if (v1 == nodeId || v2 == nodeId) {
					continue;
				}

				var nodeCircle = transformations[nodeId];
				var isIntersecting = circleToRayIntersection({
					x: transformations[v1].x,
					y: transformations[v1].y
				}, {
					x: transformations[v2].x,
					y: transformations[v2].y
				}, {
					x: nodeCircle.x,
					y: nodeCircle.y,
				}, nodeCircle.radius);

				if (isIntersecting) {
					individual.overlappingNodeWithEdge += 1;
					if (individual.intersectedNodes.indexOf(nodeId) == -1) {
						individual.intersectedNodes.push(nodeId);
					}
				}
			}
		}


		for (var j = i + 1; j < edges.length; j++) {
			var edge2 = edges[j];
			if (edge2.from == v1 || edge2.from == v2 || edge2.to == v1 || edge2.to == v2) {
				continue;
			}

			var v3 = edge2.from;
			var v4 = edge2.to;

			if (v1 == v3 || v1 == v4 && v2 == v3 || v2 == v4) {
				continue;
			}

			var isIntersecting = intersectLines({
				x: transformations[v1].x,
				y: transformations[v1].y
			}, {
				x: transformations[v2].x,
				y: transformations[v2].y
			}, {
				x: transformations[v3].x,
				y: transformations[v3].y
			}, {
				x: transformations[v4].x,
				y: transformations[v4].y
			});

			if (isIntersecting) {
				individual.intersections++;

				if (individual.nodes[v1].edges.length < individual.nodes[v2].edges.length && Math.random() < 0.5) {
					if (individual.nodesToMove.indexOf(v1) == -1) {
						individual.nodesToMove.push(v1);
					}
				} else {
					if (individual.nodesToMove.indexOf(v2) == -1) {
						individual.nodesToMove.push(v2);
					}
				}

				if (individual.nodes[v3].edges.length < individual.nodes[v4].edges.length && Math.random() < 0.5) {
					if (individual.nodesToMove.indexOf(v3) == -1) {
						individual.nodesToMove.push(v3);
					}
				} else {
					if (individual.nodesToMove.indexOf(v4) == -1) {
						individual.nodesToMove.push(v4);
					}
				}
			}
		}
	}

	if (Population.CHECK_NODE_INTERSECTION) {
		var nodes = _.values(transformations)
		for (var i = 0; i < nodes.length - 1; i++) {
			var node1 = nodes[i];
			for (var j = i + 1; j < nodes.length; j++) {
				var node2 = nodes[j];
				var distance = Math.sqrt((node2.x - node1.x) * (node2.x - node1.x) + (node2.y - node1.y) * (node2.y - node1.y));
				if (manager.areConnected(individual, node1.id, node2.id)) {
					// if (distance < 90 || distance > 450) {
					// }
					if (distance > 450) {
						individual.farFromNeighbours += 1;
					}
					if (distance < 90) {
						individual.overlappingNodes += 1;
						if (individual.intersectedNodeToNode.indexOf(node1.id) == -1) {
							individual.intersectedNodeToNode.push(node1.id);
						}
						if (individual.intersectedNodeToNode.indexOf(node2.id) == -1) {
							individual.intersectedNodeToNode.push(node2.id);
						}
					}
				} else {
					if (distance < 65) {
						individual.overlappingNodes += 1;
						if (individual.intersectedNodeToNode.indexOf(node1.id) == -1) {
							individual.intersectedNodeToNode.push(node1.id);
						}
						if (individual.intersectedNodeToNode.indexOf(node2.id) == -1) {
							individual.intersectedNodeToNode.push(node2.id);
						}
					}
				}
			}
		}
	}
}


var GridPartitioner = function (min, max, cellSize) {
	this.grid = [[]];
	this.min = min;
	this.max = max;
	this.cellSize = cellSize;
	this.initializeGrid();
}

GridPartitioner.prototype.initializeGrid = function () {
	this.grid = [[]];
	var gridWidth = Math.floor((this.max.x - this.min.x) / this.cellSize);
	var gridHeight = Math.floor((this.max.y - this.min.y) / this.cellSize);
	this.gridWidth = gridWidth;
	this.gridHeight = gridHeight;
	var totalCells = gridWidth * gridHeight;

	this.grid = new Array(gridWidth);
	for (var i = 0; i < gridWidth; i++) {
		this.grid[i] = new Array(gridHeight);
		for (var j = 0; j < gridHeight; j++) {
			this.grid[i][j] = true;
		}
	}
}

GridPartitioner.prototype.reinitialize = function (graph) {
	var transformations = graph.transformations;
	for (var nodeId in transformations) {
		var node = transformations[nodeId];
		var col = Math.floor(node.x / this.cellSize);
		var row = Math.floor(node.y / this.cellSize);
		this.grid[col][row] = false;
	}
}

GridPartitioner.prototype.removeFrom = function (col, row) {
	this.grid[col][row] = true;
}

GridPartitioner.prototype.getFreePlace = function () {
	var i = Math.floor(Math.random() * this.gridWidth);
	var j = Math.floor(Math.random() * this.gridHeight);
	while (!this.grid[i][j]) {
		i = Math.floor(Math.random() * this.gridWidth);
		j = Math.floor(Math.random() * this.gridHeight);
	}
	this.grid[i][j] = false;

	return { col: i, row: j };
}

var intersectLines = function (p1, q1, p2, q2) {
	var o1 = orientation(p1, q1, p2);
	var o2 = orientation(p1, q1, q2);
	var o3 = orientation(p2, q2, p1);
	var o4 = orientation(p2, q2, q1);

	if (o1 != o2 && o3 != o4) {
		return true;
	}

		// Special Cases
	// p1, q1 and p2 are colinear and p2 lies on segment p1q1
	if (o1 == 0 && onSegment(p1, p2, q1)) return true;
 
	// p1, q1 and p2 are colinear and q2 lies on segment p1q1
	if (o2 == 0 && onSegment(p1, q2, q1)) return true;
 
	// p2, q2 and p1 are colinear and p1 lies on segment p2q2
	if (o3 == 0 && onSegment(p2, p1, q2)) return true;
 
	 // p2, q2 and q1 are colinear and q1 lies on segment p2q2
	if (o4 == 0 && onSegment(p2, q1, q2)) return true;

	return false;
}

var onSegment = function (p, q, r) {
	if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
		q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
		return true;

	return false;
}

var orientation = function (p, q, r)
{
	var val = (q.y - p.y) * (r.x - q.x) -
			(q.x - p.x) * (r.y - q.y);
 
	if (val == 0) return 0;  // colinear
 
	return (val > 0)? 1: 2; // clock or counterclock wise
}

var circleToRayIntersection = function (p1, p2, c, r) {
	var dV = { x: p2.x - p1.x, y: p2.y - p1.y };
	var fV = { x: p1.x - c.x, y: p1.y - c.y };

	var a = dot(dV, dV);
	var b = 2 * dot(fV, dV);
	var c = dot(fV, fV) - r * r;

	var D = b*b-4*a*c;

	if (D < 0) {
		return false;
	} else {
		D = Math.sqrt(D);
		var t1 = (-b - D)/(2*a);
		var t2 = (-b + D)/(2*a);

		if (t1 >= 0 && t1 <= 1) {
			return true;
		}

		if (t2 >= 0 && t2 <= 1) {
			return true;
		}

		return false;
	}
}

var dot = function (v1, v2) {
	return v1.x * v2.x + v1.y * v2.y;
}

var separateGraph = function (graph) {
	var resultGraphs = [];
	var nodesCount = _.values(graph.transformations).length;
	bridgeCountMethod(graph, nodesCount);

	var allVisited = [];
	var alreadyStarted = {};
	for (var i = 0; i < graph.bridges.length; i++) {
		var bridge = graph.bridges[i];

		if (allVisited.indexOf(bridge.to) == -1) {
			var r = countingBFS(bridge.to, graph, bridge);
			resultGraphs.push(r);
			alreadyStarted[bridge.to] = 1;
			allVisited = allVisited.concat(r);
		}
		if (allVisited.indexOf(bridge.from) == -1) {
			var r = countingBFS(bridge.from, graph, bridge);
			resultGraphs.push(r);
			alreadyStarted[bridge.from] = 1;
			allVisited = allVisited.concat(r);
		}
	}

	// console.log(resultGraphs);
	for (var i = 0; i < resultGraphs.length; i++) {
		resultGraphs[i] = simplifyStructures(resultGraphs[i], graph);
	}
	return resultGraphs;
	graph.bridges = [];
}

var simplifyStructures = function (newG, wholeG) {
	var resultG = _.cloneDeep(wholeG);
	delete resultG.animations;
	delete resultG.animationStates;
	delete resultG.states;

	resultG.nodes = _.filter(resultG.nodes, function (value, key) {
		return newG.indexOf(value.id.toString()) >= 0;
	});

	var nodesArray = _.cloneDeep(resultG.nodes);
	resultG.nodes = {};
	for (var i = 0; i < nodesArray.length; i++) {
		// resultG
	}

	return resultG;
}

var countingBFS = function (start, graph, bridge) {
	var resultIds = [];
	var queue = [];
	var visited = {};
	visited[start] = true;
	queue.push(start);
	while (queue.length > 0) {
		var v = queue.shift();
		resultIds.push(v);
		var edges = graph.nodes[v].edges;
		for (var i = 0; i < edges.length; i++) {
			var edge = graph.edges[edges[i]];
			if ((edge.from == bridge.from && edge.to == bridge.to) ||
				(edge.to == bridge.from && edge.from == bridge.to)) {
				continue;
			}
			if (!visited[edge.to]) {
				visited[edge.to] = true;
				queue.push(edge.to);
			}
		}
	}

	return resultIds;
}

var bridgeCountMethod = function (graph, N)
{
	graph.time = 0;
	graph.bridges = [];
	// Mark all the vertices as not visited
	var visited = {};
	var disc = {};
	var low = {};
	var parent = {};


	// Initialize parent and visited, and ap(articulation point)
	// arrays
	for (var i = 0; i < N; i++)
	{
		parent[i] = -1;
		visited[i] = false;
	}

	// Call the recursive helper function to find Bridges
	// in DFS tree rooted with vertex 'i'
	for (var i in  graph.nodes) {
		if (visited[i] == false) {
			bridgeUtil(i, visited, disc, low, parent, graph);
		}
	}
}

var bridgeUtil = function (u, visited, disc, low, parent, graph) {
	var children = 0;
	visited[u] = true;

	disc[u] = graph.time;
	low[u] = graph.time;
	graph.time++;

	var edges = graph.nodes[u].edges;
	for (var i = 0; i < edges.length; i++) {
		var edge = graph.edges[edges[i]];
		var v = edge.to;

		if (!visited[v]) {
			parent[v] = u;
			bridgeUtil(v, visited, disc, low, parent, graph);

			low[u] = Math.min(low[u], low[v]);

			if (low[v] > disc[u]) {
				graph.bridges.push({ from: edge.from, to: edge.to, id: edges[i]});
			}
		} else if (v != parent[u]) {
			low[u] = Math.min(low[u], disc[v]);
		}
	}
}