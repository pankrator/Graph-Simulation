var KEEP_OFFSET = 30;
var ELITISM_OFFSET = 1;

var Population = function () {
	this.individuals = [];
	this.bestIndividual = null;
}

Population.prototype.addIndividual = function (individual) {
	this.individuals.push(individual);
}

Population.generateRandomGraph = function (graph) {
	var resultGraph = _.cloneDeep(graph);
	var transformations = resultGraph.transformations;
	for (var nodeId in transformations) {
		var nodeTransformation = transformations[nodeId];
		nodeTransformation.x = Math.floor(Math.random() * (600 - 20) + 20);
		nodeTransformation.y = Math.floor(Math.random() * (600 - 20) + 20);
	}

	return resultGraph;
}

Population.prototype.getBestIndividual = function () {
	// this.evaluateIndividuals();
	// this.individuals.sort(function (a, b) {
	// 	return a.intersections - b.intersections;
	// });

	// return this.individuals[0];

	return this.bestIndividual;
}

Population.prototype.evolvePopulation = function () {
	this.evaluateIndividuals();
	this.individuals.sort(function (a, b) {
		return a.intersections - b.intersections;
	});

	this.bestIndividual = this.individuals[0];

	for (var i = KEEP_OFFSET; i < this.individuals.length; i++) {
		var firstParentIndex = Math.floor(Math.random() * (this.individuals.length - 1) + 1);
		var secondParentIndex = Math.floor(Math.random() * (this.individuals.length - 1) + 1);
		while (secondParentIndex == firstParentIndex) {
			secondParentIndex = Math.floor(Math.random() * (this.individuals.length - 1) + 1);
		}
		var child = this.crossover(firstParentIndex, secondParentIndex);
		this.individuals[i] = child;
	}

	for (var i = ELITISM_OFFSET; i < this.individuals.length; i++) {
		this.mutate(this.individuals[i]);
	}
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

Population.prototype.mutate = function (individual) {
	// TODO: Mutate in some way
}

Population.prototype.evaluateIndividuals = function () {
	for (var i = 0; i < this.individuals.length; i++) {
		this.countIntersections(this.individuals[i]);
	}
}

Population.prototype.countIntersections = function (individual) {
	individual.intersections = 0;
	var transformations = individual.transformations;
	var edges = _.values(individual.edges);
	// console.log(edges);
	for (var i = 0; i < edges.length - 1; i++) {
		var v1 = edges[i].from;
		var v2 = edges[i].to;

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
				x: individual.transformations[v1].x,
				y: individual.transformations[v1].y
			}, {
				x: individual.transformations[v2].x,
				y: individual.transformations[v2].y
			}, {
				x: individual.transformations[v3].x,
				y: individual.transformations[v3].y
			}, {
				x: individual.transformations[v4].x,
				y: individual.transformations[v4].y
			});

			if (isIntersecting) {
				individual.intersections++;
			}
		}
	};
}

var intersectLines = function(p1, p2, q1, q2) {
	var o1 = orientation(p1, p2, q1);
    var o2 = orientation(p1, p2, q2);
    var o3 = orientation(q1, q2, p1);
    var o4 = orientation(q1, q2, p2);

    return (o1 != o2 && o3 != o4);
}

var orientation = function(p, q, r)
{
    var val = (q.y - p.y) * (r.x - q.x) -
              (q.x - p.x) * (r.y - q.y);
 
    if (val == 0) return 0;  // colinear
 
    return (val > 0)? 1: 2; // clock or counterclock wise
}