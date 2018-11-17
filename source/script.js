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
      workerURL,
      audioContext,
      stopSequence;

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
    context.lineWidth = diameter / 16;
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
  audioContext = new (window.AudioContext || window.webkitAudioContext || function () {})();

  // Set up an audio context oscillator to create a beep with the provided parameters
  function beep (duration, frequency, volume) {
    if (audioContext) {
      var oscillator, gainNode;
      duration = duration || 500;
      // Create audio node components
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();
      // Connect audio node components
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      // Assign audio node component parameters
      gainNode.gain.value = 0;
      oscillator.frequency.value = frequency;
      // Begin playing audio for a set period of time
      oscillator.start();
      // Set up quick gradual volume transitions to prevent popping noise
      gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.005);
      gainNode.gain.setTargetAtTime(0, audioContext.currentTime + (duration / 1000), 0.005);
    }
  }

  // Play a sequence of beeps based on an array of time intervals between beeps
  function playSequence (sequence, repeat) {
    var doBeep, timeout, interval, next, stopSequence;
    // Play a single beep and queue the next one
    doBeep = function (index) {
      stopInterval(interval);
      if (repeat) { index %= sequence.length; }
      timeout = sequence[index];
      if (typeof timeout === 'number') {
        beep(100, 1000, 0.05);
        next = doBeep.bind({}, index + 1);
        interval = startInterval(next, timeout);
      }
    };
    // A continuation function for stopping this rhythm function
    stopSequence = function () {
      stopInterval(interval);
    };
    // Start the beep sequence
    doBeep(0);
    // Return the continuation function so the caller can later cancel sequence
    return stopSequence;
  }

  stopSequence = function () {};

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
  function write (time) {
    var seconds = Math.ceil(time / 1000) % 60,
        minutes = Math.floor(Math.ceil(time / 1000) / 60) % 60,
        hours   = Math.floor(Math.ceil(time / 1000) / (60 * 60)),
        titleText = '', on = false, complete;
    complete = function () {
      var color;
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
      if (document.getElementsByName('repeat')[0].checked === true) {
        playSequence([0], false);
        setTimeout(function () { submit(); }, 0);
      } else {
        title.text = 'Done!';
        text.innerHTML = titleText;
        stopSequence = playSequence([150, 150, 1000], true);
        blinkInterval = startInterval(complete, 1000);
        body.setAttribute('class', 'done');
      }
    } else if (text.innerHTML !== titleText) {
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
        timeLeft = totalTime,
        lastFaviconTime = timeLeft,
        lastTitleTime = timeLeft,
        startAnimation;
    startAnimation = function () {
      if (paused) {
        startTime = new Date().getTime() + timeLeft - totalTime;
        return;
      }
      var currentTime = new Date().getTime(),
          percentComplete = (currentTime - startTime) / (totalTime);
      timeLeft = totalTime - currentTime + startTime;
      draw(canvas, percentComplete);
      if (lastFaviconTime - timeLeft > 100 || lastFaviconTime === totalTime || timeLeft <= 0) {
        lastFaviconTime = timeLeft;
        drawFavicon(favicon, percentComplete, timeLeft);
      }
      if (lastTitleTime - timeLeft > 100 || lastTitleTime === totalTime || timeLeft <= 0) {
        lastTitleTime = timeLeft;
        write(timeLeft);
      }
      if (percentComplete >= 1) {
        stopInterval(updateInterval);
      }
    };
    body.setAttribute('class', 'running');
    stopInterval(updateInterval);
    stopInterval(blinkInterval);
    stopSequence();
    drawFavicon(favicon, 0, totalTime);
    draw(canvas, 0);
    write(totalTime);
    // Countdown interval setup
    updateInterval = startInterval(startAnimation, 10);
  }

  function clearTimer() {
    paused = false;
    stopInterval(updateInterval);
    stopInterval(blinkInterval);
    stopSequence();
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
        case 'h':
          hours = eval(match[1]);
          break;
        case 's':
          seconds = eval(match[1]);
          break;
        case 'm':
        // Assume minutes if no unit
        default:
          minutes = eval(match[1]);
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
    // Space key
    if (event.keyCode === 32 && body.getAttribute('class').indexOf('complete') === -1) {
      if (body.getAttribute('class').indexOf('done') !== -1) {
        clearTimer();
      } else if (paused) {
        resumeTimer();
      } else {
        pauseTimer();
      }
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
