var ButtonGroup = function() {
	this.buttons = [];
}

ButtonGroup.prototype.unselect = function(ev) {
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].style.background = "#BDC6EA";
	};
	ev.target.style.background = "#4F68CB";
};

ButtonGroup.prototype.addButton = function(buttonElement) {
	this.buttons.push(buttonElement);
	buttonElement.addEventListener("click", this.unselect.bind(this));
}

ButtonGroup.prototype.addListener = function (buttonElement, listener) {
	buttonElement.addEventListener("click", listener);
}
