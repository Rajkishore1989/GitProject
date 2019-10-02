require ['jquery', 'underscore', 'hilo', 'json'], ($, _, hilo) ->

    module "HiLo"

    test "Test HiLo allocation (whole first range and first of second)", 14, () ->

        seq = 'SampleSeq1'
        allocCalls = 0
        allocFirst = (sequence, success) -> 
            allocCalls += 1
            success({ currentHi: 1, maxLo: 10, currentLo: 0 })

        hilo.clear(seq)

        hilo.nextId(seq,
            (id) -> strictEqual(id, i, "Expecting " + i + " as the allocated id"),
            allocFirst) for i in [1..10]
        equals(allocCalls, 1, "Only one allocation expected")
        
        allocCalls = 0
        allocSecond = (sequence, success) -> 
            allocCalls += 1
            success({ currentHi: 11, maxLo: 10, currentLo: 0 })

        hilo.nextId(seq,
            (id) -> strictEqual(id, 11, "Expecting 11 as the next allocated id"),
            allocSecond)
        equals(allocCalls, 1, "Only one allocation expected")

        seq = 'SampleSeq2'
        hilo.clear(seq)
        hilo.nextId(seq,
            (id) -> strictEqual(id, 1, "Expecting 1 as the allocated id for different sequence"),
            allocFirst)
