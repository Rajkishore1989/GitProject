/*global require,describe,beforeEach,it,expect,waitsFor,runs */
define(['config/decisionTable'], function(DecisionTable) {

    describe('Decision Table', function() {

        var table1 = {
            conditions: [
                'this.FirstName === "Miguel"',
                'this.State === "Open"'
            ],
            actions: [
                '"My Name is " + this.FirstName',
                '"State is " + this.State '
            ],
            rules: [
                // null is 'don't care'
                { values: [true, null], actions: [0] }, // rule 0
                { values: [true, false], actions: [1, 0] }, // rule 1
                { values: [false, true], actions: [1] } // rule 2
            ]
        };

        var scope1 = {
            FirstName: 'Miguel',
            State: 'Pending'
        };

        //beforeEach(function() {});

        it('should evaluate condition values', function() {

            var dt1 = new DecisionTable(table1);

            var conditionValues = dt1.conditionValues(scope1);
            expect(conditionValues.length).toBe(table1.conditions.length);
            expect(conditionValues[0].value).toBe(true);
            expect(conditionValues[1].value).toBe(false);
        });

        it ('should evaluate rule matches based on condition values', function() {

            var dt1 = new DecisionTable(table1);

            var conditionValues = dt1.conditionValues(scope1);
            var ruleMatches = dt1.ruleMatches(conditionValues);
            expect(ruleMatches.length).toBe(table1.rules.length);
            console.log(ruleMatches[0]);
            expect(ruleMatches[0].match).toBe(true);
            expect(ruleMatches[1].match).toBe(true);
            expect(ruleMatches[2].match).toBe(false);

        });

        it('should select applicable actions based on rules matched', function() {

            var dt1 = new DecisionTable(table1);

            var conditionValues = dt1.conditionValues(scope1);
            var ruleMatches = dt1.ruleMatches(conditionValues);
            var actionIndexes = dt1.actionsIndexes(ruleMatches);
            expect(actionIndexes.length).toBe(2);
            expect(actionIndexes[0]).toBe(0);
            expect(actionIndexes[1]).toBe(1);
        });

        it('should execute actions given a scope object', function() {

            var dt1 = new DecisionTable(table1);

            var actionResults = dt1.evaluate(scope1);
            expect(actionResults.length).toBe(2);
            expect(actionResults[0]).toBe('My Name is Miguel');
            expect(actionResults[1]).toBe('State is Pending');
        });
    });
});