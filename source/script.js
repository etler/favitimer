(function () {
  "use strict";
  // Setup element references and global state
  var favicon = document.createElement('canvas'),
      canvas = document.getElementById('canvas'),
      link = document.getElementById('favicon'),
      title = document.getElementById('title'),
      text = document.getElementById('text'),
      start = document.getElementById('start'),
      stop = document.getElementById('stop'),
      clear = document.getElementById('clear'),
      form = document.getElementById('form'),
      body = document.getElementsByTagName('body')[0],
      updateInterval,
      blinkInterval,
      paused,
      workerURL;

  // Hidden canvas setup
  favicon.height = 16;
  favicon.width = 16;

  // In-line web worker script setup
  workerURL = (function () {
    var blob, intervalWorker, workerString, Builder;
    intervalWorker = function () {
      var interval = null;
      onmessage = function(event) {
        if (event.data.start && !interval) {
          interval = setInterval(function () {
            postMessage('');
          }, event.data.ms);
        }
        if (event.data.stop) {
          clearInterval(interval);
          interval = null;
        }
      };
    };
    // Execute setup function when run from the web worker
    workerString = "(" + intervalWorker.toString() + ")();";
    // Use Blob to create a temporary URL for the worker script
    if (Blob) {
      blob = new Blob([workerString], {type: 'application/javascript'});
    } else if (window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder) {
      Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
      blob = new Builder();
      blob.append(workerString);
      blob = blob.getBlob();
    }
    if (blob) {
      return URL.createObjectURL(blob);
    } else {
      return 'interval.js';
    }
  })();

  // Drawing Methods
  function draw(canvas, percent, ms, color) {
    var context = canvas.getContext('2d'),
        diameter;
    diameter = Math.min(canvas.height, canvas.width);
    context.lineWidth = diameter / 12;
    if (percent >= 1){
      context.strokeStyle = '#00cc00';
    } else {
      context.strokeStyle = '#dd0000';
    }
    context.strokeStyle = color || context.strokeStyle;
    context.font = 'bold 7.5px monospace';
    context.textAlign = 'center';
    context.fillStyle = '#333333';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.arc(diameter / 2, diameter / 2, diameter * 0.375, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent, false);
    context.stroke();
    // Text rendering to show most significant unit within the favicon
    if (ms > 0) {
      ms /= 1000;
      ms = Math.ceil(ms);
      if (ms > 60) { ms /= 60; }
      if (ms > 60) { ms /= 60; }
      ms = Math.floor(ms);
      context.fillText(ms, 8, 11, 10);
    }
  }

  function drawFavicon(canvas, percent, ms, color) {
    draw(canvas, percent, ms, color);
    link.href = canvas.toDataURL('image/png');
  }

  // Audio Methods
  function beep() {
    // Data URI to cut out an http request
    var sound = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    sound.play();
  }

  // Timing Methods
  function stopInterval (interval) {
    // Interval can be an id is created from setInterval, or a worker
    if (typeof interval === 'number') {
      clearInterval(interval);
    } else if (interval) {
      interval.postMessage({stop:true});
      interval.terminate();
    }
  }

  function startInterval (callback, delay) {
    var interval;
    try {
      interval = new Worker(workerURL);
      interval.onmessage = callback;
      interval.postMessage({start: true, ms: delay});
    } catch (error) {
      interval = setInterval(callback, delay);
    } finally {
      return interval;
    }
  }

  // Timer Text Method
  function write(time) {
    var seconds = Math.ceil(time / 1000) % 60,
        minutes = Math.floor(Math.ceil(time / 1000) / 60) % 60,
        hours   = Math.floor(Math.ceil(time / 1000) / (60 * 60)),
        titleText = '', on = false, complete;
    complete = function () {
      var color;
      beep();
      if (on){
        color = '#00cc00';
        on = false;
      } else {
        color = '#dd0000';
        on = true;
      }
      drawFavicon(favicon, 1, 0, color);
    };
    titleText = '';
    if (hours) {
      titleText += hours + "h ";
    }
    if (hours || minutes) {
      titleText += minutes + "m ";
    }
    if (hours || minutes || seconds) {
      titleText += seconds + "s";
    }
    if (!hours && !minutes && !seconds) {
      title.text = 'Done!';
      text.innerHTML = titleText;
      beep();
      blinkInterval = startInterval(complete, 1000);
      body.setAttribute('class', 'done');
    } else {
      title.text = titleText;
      text.innerHTML = titleText;
    }
  }

  // Control Methods
  function startTimer(hours, minutes, seconds) {
    if (!seconds && !minutes && !hours) {
      return;
    }
    // Initialize
    var totalTime = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000,
        startTime = new Date().getTime(),
        timeLeft = startTime,
        startAnimation;
    startAnimation = function () {
      if (paused) {
        startTime = new Date().getTime() + timeLeft - totalTime;
        return;
      }
      var currentTime = new Date().getTime(),
          percentComplete = (currentTime - startTime) / (totalTime);
      timeLeft = totalTime - currentTime + startTime;
      drawFavicon(favicon, percentComplete, timeLeft);
      draw(canvas, percentComplete);
      write(timeLeft);
      if (percentComplete >= 1) {
        stopInterval(updateInterval);
      }
    };
    body.setAttribute('class', 'running');
    stopInterval(updateInterval);
    stopInterval(blinkInterval);
    drawFavicon(favicon, 0, totalTime);
    draw(canvas, 0);
    write(totalTime);
    // Countdown interval setup
    updateInterval = startInterval(startAnimation, 50);
  }

  function clearTimer() {
    paused = false;
    stopInterval(updateInterval);
    stopInterval(blinkInterval);
    drawFavicon(favicon, 1);
    title.text = 'Favicon Countdown Timer';
    body.setAttribute('class', 'complete');
  }

  function pauseTimer() {
    paused = true;
    body.setAttribute('class', 'pause');
  }

  function resumeTimer() {
    paused = false;
    body.setAttribute('class', 'running');
  }

  // Initialization Methods
  function normalizeForm() {
    var hours = Number(form.elements.hours.value || '0'),
        minutes = Number(form.elements.minutes.value || '0'),
        seconds = Number(form.elements.seconds.value || '0'),
        totalTime = 60 * 60 * hours + 60 * minutes + seconds;
    totalTime = Math.min(totalTime, 100 * 60 * 60 - 1);
    hours = Math.floor(totalTime / (60 * 60));
    minutes = Math.floor(totalTime / 60) % 60;
    seconds = Math.round(totalTime % 60);
    if (hours) {
      form.elements.hours.value = hours;
    } else {
      form.elements.hours.value = '';
    }
    if (hours || minutes) {
      form.elements.minutes.value = minutes;
    } else {
      form.elements.minutes.value = '';
    }
    if (hours || minutes || seconds) {
      form.elements.seconds.value = seconds;
    } else {
      form.elements.seconds.value = '';
    }
  }

  function submit() {
    var hours, minutes, seconds;
    paused = false;
    normalizeForm();
    hours = Number(form.elements.hours.value || '0');
    minutes = Number(form.elements.minutes.value || '0');
    seconds = Number(form.elements.seconds.value || '0');
    startTimer(hours, minutes, seconds);
  }

  function executeSearch (search) {
    // Matches a decimal or fraction digit and a time unit
    var searchRegex = /((?:\d*\.|\d+\s*\/\s*)?\d+)[\s+]*(se?c?o?n?d?s?|mi?n?u?t?e?s?|ho?u?r?s?|$)(?![a-z])/gi,
        hours = 0,
        minutes = 0,
        seconds = 0,
        match, unit;
    // exec remembers the last match location so each match is new until exhausted
    while (match = searchRegex.exec(search)) {
      unit = match[2] || '';
      // Eval allows for division. This is only as safe as the reg-ex parsing is.
      switch (unit[0]) {
        case 'm':
          minutes = eval(match[1]);
          break;
        case 'h':
          hours = eval(match[1]);
          break;
        // Also assume seconds if no unit
        default:
          seconds = eval(match[1]);
          break;
      }
    }
    // Fill out the form with input
    if (hours || minutes || seconds) {
      start.removeAttribute('class');
      if (hours)   { form.elements.hours.value   = hours;   }
      if (minutes) { form.elements.minutes.value = minutes; }
      if (seconds) { form.elements.seconds.value = seconds; }
      submit();
    }
  }

  // Event Setup

  // Stop Timer
  stop.addEventListener('click', clearTimer);
  clear.addEventListener('click', clearTimer);
  // Start Timer
  start.addEventListener('click', submit);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submit();
  });
  document.addEventListener('keyup', function (event) {
    // Enter key
    if (event.keyCode === 13) {
      submit();
    }
  });
  // Pause Timer
  text.addEventListener('click', function () {
    if (paused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  });
  // Input constraints and auto advance
  Array.prototype.forEach.call(document.getElementsByTagName('input'), function (input) {
    input.addEventListener('keypress', function (event) {
      // Ignore non input keys
      if (event.keyCode && !event.charCode) {
        return;
      }
      // Only allow digits
      if ((event.charCode < 48 || event.charCode > 57) && !event.ctrlKey) {
        event.preventDefault();
      }
    });
    input.addEventListener('keyup', function (event) {
      var hasValue = Array.prototype.some.call(form.elements, function (element) {
        return element.value;
      });
      // Enable start button if any field has input
      if (hasValue) {
        start.removeAttribute('class');
      } else {
        start.setAttribute('class', 'disabled');
      }
      // Auto advance after filling field
      if (event.keyCode >= 48 && event.keyCode <= 57 && event.currentTarget.value.length >= 2) {
        var index = Array.prototype.indexOf.call(form.elements, event.currentTarget) + 1;
        if (form[index].tagName === 'INPUT') {
          form[index].focus();
        }
      }
    });
  });
  // Initialization
  drawFavicon(favicon, 1);
  if (window.location.search) {
    executeSearch(decodeURIComponent(window.location.search));
  } else {
    form.elements.hours.focus();
  }
})();
