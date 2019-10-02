(function() {

  require(['jquery', 'underscore', 'hilo', 'json'], function($, _, hilo) {
    module("HiLo");
    return test("Test HiLo allocation (whole first range and first of second)", 14, function() {
      var allocCalls, allocFirst, allocSecond, i, seq, _i;
      seq = 'SampleSeq1';
      allocCalls = 0;
      allocFirst = function(sequence, success) {
        allocCalls += 1;
        return success({
          currentHi: 1,
          maxLo: 10,
          currentLo: 0
        });
      };
      hilo.clear(seq);
      for (i = _i = 1; _i <= 10; i = ++_i) {
        hilo.nextId(seq, function(id) {
          return strictEqual(id, i, "Expecting " + i + " as the allocated id");
        }, allocFirst);
      }
      equals(allocCalls, 1, "Only one allocation expected");
      allocCalls = 0;
      allocSecond = function(sequence, success) {
        allocCalls += 1;
        return success({
          currentHi: 11,
          maxLo: 10,
          currentLo: 0
        });
      };
      hilo.nextId(seq, function(id) {
        return strictEqual(id, 11, "Expecting 11 as the next allocated id");
      }, allocSecond);
      equals(allocCalls, 1, "Only one allocation expected");
      seq = 'SampleSeq2';
      hilo.clear(seq);
      return hilo.nextId(seq, function(id) {
        return strictEqual(id, 1, "Expecting 1 as the allocated id for different sequence");
      }, allocFirst);
    });
  });

}).call(this);
