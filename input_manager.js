function MouseData() {
    this.scroll = 0;
    this.left = false;
    this.middle = false;
    this.right = false;
    this.x = null;
    this.y = null;
}

var InputManager = function (canvas) {
	this.mouse = new MouseData();
	this.mouseDownCallbacks = [];
	this.mouseUpCallbacks = [];
	this.canvasBoundaries = canvas.getBoundingClientRect();

	canvas.addEventListener("mousemove", this.mouseMove.bind(this));
	canvas.addEventListener("mousedown", this.mouseDown.bind(this));
	canvas.addEventListener("mouseup", this.mouseUp.bind(this));
	canvas.addEventListener("contextmenu", this.contextMenuListener.bind(this));
}

InputManager.prototype.detectMouseDown = function (callback) {
	this.mouseDownCallbacks.push(function (button) {
		callback(button);
	}.bind(this));
}

InputManager.prototype.detectMouseUp = function (callback) {
	this.mouseUpCallbacks.push(function (button) {
		callback(button);
	}.bind(this));
}

InputManager.prototype.mouseMove = function (event) {
	var doc = document.documentElement;

	var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
	this.mouse.x = event.x - this.canvasBoundaries.left;
	this.mouse.y = event.y - this.canvasBoundaries.top + top;
}

InputManager.prototype.mouseUp = function (event) {
	switch (event.button) {
        case 0:
            this.mouse.left = false;
            break;
        case 1:
            this.mouse.middle = false;
            break;
        case 2:
            this.mouse.right = false;
            break;
    }

    for (var i = 0; i < this.mouseUpCallbacks.length; i++) {
    	this.mouseUpCallbacks[i](event.button);
    }
}

InputManager.prototype.mouseDown = function (event) {
	switch (event.button) {
	    case 0:
	        this.mouse.left = true;
	        break;
	    case 1:
	        this.mouse.middle = true;
	        break;
	    case 2:
	        this.mouse.right = true;
            break;
    }

    for (var i = 0; i < this.mouseDownCallbacks.length; i++) {
    	this.mouseDownCallbacks[i](event.button);
    }
}

InputManager.prototype.contextMenuListener = function(event) {
	event.preventDefault();
}
