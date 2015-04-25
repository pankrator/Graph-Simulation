var ButtonGroup = function() {
	this.buttons = [];
}

var unselect = function(ev) {
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].style.background = "blue";
	};
	ev.target.style.background = "red";
}.bind(this);

ButtonGroup.prototype.addButton = function(buttonElement) {
	this.buttons.push(buttonElement);
	buttonElement.addEventListener("click", unselect);
}
