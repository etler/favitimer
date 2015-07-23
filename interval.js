var interval = null;
this.onmessage = function(event) {
  if (event.data.start) {
    interval = setInterval(function () {
      this.postMessage('');
    }, event.data.ms);
  }
  if (event.data.stop) {
    clearInterval(interval);
  }
};
