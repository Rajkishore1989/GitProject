require(['jquery', 'underscore', 'jquery.pickList', 'json'], function ($, _, pickList) {
    module("jQuery.pickList");
    test("Only SELECTs allowed", 1, function () {
        return raises(function () {
            return $('#badPickList').pickList();
        }, function (e) {
            return e === '$.pickList plugin can only be used in SELECT elements';
        }, 'pickList failed for INPUT element');
    });
    test("Must have data-pick-list-id attribute", 1, function () {
        return raises(function () {
            return $('#pickListWithNoDataAttr').pickList();
        }, function (e) {
            return /missing the .* attribute with the name of the Pick List to use/.test(e);
        }, 'pickList failed for missing data attribute');
    });
    test("Load pick list data from sessionStorage", 3, function () {
        var $pl1, i, key, obj, pickListId, value, _i;
        pickListId = Math.random();
        obj = {};
        for (i = _i = 1; _i <= 10; i = ++_i) {
            obj[i.toString()] = 'Item ' + i;
        }
        value = JSON.stringify(obj);
        key = $.fn.pickList.storageKey(pickListId);
        sessionStorage[key] = value;
        $pl1 = $('#pickList1');
        $pl1.data('pickListId', pickListId);
        $pl1.pickList();
        strictEqual($pl1.find('option').length, 10 + 1, 'number of OPTIONs loaded from sessionStorage');
        strictEqual($pl1.find(':nth-child(2)').val(), '1');
        return strictEqual($pl1.find(':nth-child(2)').text(), 'Item 1');
    });
    asyncTest("Json load pick lists by ids", 11, function () {
        return $.getJSON('PickLists/Load?ids=CTY,STCR', function (lists) {
            var countries, countryCodes, countryNames, numCountries, reasons, reasonsCodes;
            strictEqual(_.keys(lists).length, 2, 'check number of downloaded lists');
            countries = lists['CTY'];
            ok(countries, 'check if CTY list is present');
            countryCodes = _.keys(countries.rows);
            countryNames = _.values(countries.rows);
            strictEqual(countryCodes[0], 'A', 'check Guyana key');
            strictEqual(countryNames[0], 'Guyana', 'check Guyana value');
            numCountries = countryCodes.length;
            strictEqual(countryCodes[numCountries - 1], 'Z', 'check Belize key');
            strictEqual(countryNames[numCountries - 1], 'Belize', 'check Belize value');
            reasons = lists['STCR'];
            ok(reasons, 'check if STCR is present');
            reasonsCodes = _.keys(reasons.rows);
            strictEqual(reasonsCodes.length, 3);
            strictEqual(reasonsCodes[0], 'CANC');
            strictEqual(reasonsCodes[1], 'Lost');
            strictEqual(reasonsCodes[2], 'Stol');
            return start();
        });
    });
    asyncTest("Json sync and storage", 5, function () {
        var k = function (id) {
            return $.fn.pickList.storageKey(id);
            },
            storage = sessionStorage;
        storage.clear();
        return $.fn.pickList.sync(['CTY', 'STCR'], function (lists) {
            var CTY, STCR;
            strictEqual(_.keys(lists).length, 2, 'check number of downloaded lists');
            CTY = storage[k('CTY')];
            ok(CTY, 'countries list downloaded and stored');
            ok($.parseJSON(CTY), 'countries json parsed');
            STCR = storage[k('STCR')];
            ok(STCR, 'storecard cancellation reasons list downloaded and stored');
            equal(_.keys($.parseJSON(STCR)).length, 3, 'storecard reasons json parsed');
            return start();
        });
    });
    asyncTest("Map list of keys/codes to values", 3, function () {
        pickList.k2v('CTY', ['J', 'N'], function (rows) {
            strictEqual(_.keys(rows).length, 2);
            strictEqual(rows['J'], 'Jamaica');
            strictEqual(rows['N'], 'Antigua');
            start();
        });
    });
});
