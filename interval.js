var interval = null;
onmessage = function(event) {
  if (event.data.start) {
    interval = setInterval(function () {
      postMessage('');
    }, event.data.ms);
  }
  if (event.data.stop) {
    clearInterval(interval);
  }
};
