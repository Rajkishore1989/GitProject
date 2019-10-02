/*global define, module, inject, describe, beforeEach, afterEach, it, expect, spyOn*/
define(['jquery', 'angular', 'angular.mock', 'angularShared/filters'],
    function ($, angular, angularMock, salesController) {
        'use strict';

        describe('COSACS Filters', function () {

            beforeEach(module('cosacs.filters'));

            describe('titleize filter Tests', function () {
                it('should returns a sentence in title format', function () {
                    inject(function (titleizeFilter) {
                        var sentence = 'the test  text';
                        var expected = 'The Test  Text';

                        expect(titleizeFilter(sentence)).toEqual(expected);
                        //expect(titleizeFilter(sentence)[0]).toEqual(expected);   // Start of 'yhe'
                    });
                });
            });

            describe('humanize filter Tests', function () {
                it('should returns a sentence humanized given a single word', function () {
                    inject(function (humanizeFilter) {
                        var word = 'SomeWordHere';
                        var expected = 'Some word here';

                        expect(humanizeFilter(word)).toEqual(expected);
                        expect(humanizeFilter('some_word_here')).toEqual(expected);
                    });
                });
            });

            describe('linebreak filter Tests', function () {
                it('should returns a sentence with the break line been replaced by html tag "<br>"', function () {
                    inject(function (linebreakFilter) {
                        var sentence = 'Some\rWordHere';
                        var expected='<br>';

                        expect(linebreakFilter(sentence)).toContain(expected);
                    });
                });
            });

            describe('IsNull filter Tests', function () {
                it("should returns the same passed input if it has a value", function () {
                    inject(function (linebreakFilter) {
                        var word = 'Test input';

                        expect(linebreakFilter(word)).toEqual(word);
                    });
                });

                it("should returns the replacement text if the input doesn't has a value", function () {
                    inject(function (isNullFilter) {
                        var word=null;
                        var expected='replacement text';

                        expect(isNullFilter(word,expected)).toEqual(expected);  // input ==> undefined
                        expect(isNullFilter(null,expected)).toEqual(expected);  // input ==> null
                        expect(isNullFilter('',expected)).toEqual(expected);    // input ==> <empty string>
                    });
                });
            });

            describe('stringList filter Tests', function () {
                it("should returns a comma separated joined string given an array input", function () {
                    inject(function (stringListFilter) {
                        var stringArray = ['Test', 'input', 'of','strings'];
                        var numberArray=[1,2,3,4];

                        expect(stringListFilter(stringArray)).toEqual('Test,input,of,strings');
                        expect(stringListFilter(numberArray)).toEqual('1,2,3,4');
                    });
                });

                it("should returns the the word 'Unknown' if the input was not an array", function () {
                    inject(function (stringListFilter) {
                        var word;
                        var expected='Unknown';

                        expect(stringListFilter(word)).toEqual(expected);

                    });
                });

            });

        });

    });
