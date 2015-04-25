var EventBus = function () {
};

EventBus.events = {};

EventBus.subscribe = function (eventName, callback) {
    if (!this.events[eventName]) {
        this.events[eventName] = {
            listeners: []
        };
    }

    this.events[eventName].listeners.push(callback);
};

EventBus.publish = function (eventName) {
    if (!this.events[eventName]) {
        // throw new Error("No such event " + eventName);
        return;
    }

    var listeners = this.events[eventName].listeners;
    for (var i = 0; i < listeners.length; i++) {
        var args = Array.prototype.slice.call(arguments, 1);
        listeners[i].apply(undefined, args);
    }
};

// EventBus.prototype.removeEventListener = function (callback) {
//     for (var i = 0; i < this.listeners.length; i++) {
//         if (this.listeners[i] == callback) {
//             this.listeners[i] = this.listeners[this.listeners.length - 1];
//             this.listeners.pop();
//         }
//     }
// };
