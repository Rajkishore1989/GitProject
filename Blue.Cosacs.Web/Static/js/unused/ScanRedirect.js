(function() {
  var code, scanactive;

  code = [];

  scanactive = false;

  $(window).keydown(function() {
    var EndCaptureCode, StartCaptureCode, active;
    EndCaptureCode = 13;
    StartCaptureCode = 13;
    if (event.keyCode === EndCaptureCode && !$('.scanning').length) {
      StateMachine.updateState(code);
      scanactive = false;
    }
    if (event.keyCode === StartCaptureCode && !$('.scanning').length) {
      scanactive = true;
      window.setTimeout(scanactive = false, 1000);
      code = [];
      active = true;
    }
    if (scanactive) {
      return code.push(event.keyCode);
    }
  });

}).call(this);
