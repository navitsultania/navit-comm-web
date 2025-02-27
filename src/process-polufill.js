// Add global variables required by simple-peer and other libraries
window.global = window;
window.process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: function(cb) { setTimeout(cb, 0); }
};
window.Buffer = require('buffer/').Buffer;