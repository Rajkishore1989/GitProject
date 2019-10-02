(function() {
  var code, display, keytranslate, scanactive, showcharacter;

  keytranslate = {
    0: 'Null character',
    1: 'Start of Header',
    2: 'Start of Text',
    3: 'End of Text',
    4: 'End of Transmission',
    5: 'Enquiry',
    6: 'Acknowledgment',
    7: 'Bell',
    8: 'Backspace',
    9: 'Horizontal Tab',
    10: 'Line feed',
    11: 'Vertical Tab',
    12: 'Form feed',
    13: 'Carriage return',
    14: 'Shift Out',
    15: 'Shift In',
    16: 'Data Link Escape',
    17: 'Device Control 1 (oft. XON)',
    18: 'Device Control 2',
    19: 'Device Control 3 (oft. XOFF)',
    20: 'Device Control 4',
    21: 'Negative Acknowledgement',
    22: 'Synchronous idle',
    23: 'End of Transmission Block',
    24: 'Cancel',
    25: 'End of Medium',
    26: 'Substitute',
    27: 'Escape',
    28: 'File Separator',
    29: 'Group Separator',
    30: 'Record Separator',
    31: 'Unit Separator',
    127: 'Delete'
  };

  code = [];

  scanactive = false;

  $('#scanstart').mousedown(function() {
    if (!$('.scanning').length) {
      $('#scanstart').text("Click to stop diagnostics test");
      $('#diag').removeClass('hidden');
      return $('#scanstart').addClass('scanning');
    } else {
      $('#scanstart').text("Click to start diagnostics test");
      $('#diag').addClass('hidden');
      return $('#scanstart').removeClass('scanning');
    }
  });

  showcharacter = function(code) {
    return String.fromCharCode(code);
  };

  display = function() {
    var startchar, stopchar;
    scanactive = !scanactive;
    startchar = keytranslate[code[0]];
    stopchar = keytranslate[code[code.length - 1]];
    if (startchar == null) {
      startchar = showcharacter(code[0]);
    }
    if (stopchar == null) {
      stopchar = showcharacter(code[code.length - 1]);
    }
    $('#scanprefix').text(startchar + ' (' + code[0] + ') ');
    $('#scansuffix').text(stopchar + ' (' + code[code.length - 1] + ') ');
    return $('#defaultsettings').removeClass('hidden');
  };

  $(window).keydown(function() {
    var active;
    if ($('.scanning').length > 0) {
      if (!scanactive) {
        window.setTimeout(display, 1000);
        code = [];
        active = true;
      }
      return code.push(event.keyCode);
    }
  });

}).call(this);
