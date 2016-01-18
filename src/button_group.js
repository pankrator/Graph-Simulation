var ButtonGroup = function () {
	this.buttons = [];
	this.selectedIndex = null;
}

ButtonGroup.prototype.select = function (index) {
	for (var i = 0; i < this.buttons.length; i++) {
		this.buttons[i].style.background = "#BDC6EA";
	};

	this.buttons[index].style.background = "#4F68CB";
	this.selectedIndex = index;
	// ev.target.style.background = "#4F68CB";
};

ButtonGroup.prototype.addButton = function (buttonElement) {
	this.buttons.push(buttonElement);
	buttonElement.addEventListener("click", this.select.bind(this, this.buttons.length - 1));

	return this.buttons.length - 1;
}

ButtonGroup.prototype.getSelectedButton = function () {
	return this.selectedIndex;
}

ButtonGroup.prototype.addListener = function (index, listener) {
	this.buttons[index].addEventListener("click", 
		function() {
			this.select(index);
			listener();
		}.bind(this));
}
