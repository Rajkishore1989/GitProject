/* global define, eval */
/* jshint evil: true */
/* jshint ignore:start */
/**
 *  This module implements the core Decision Table functionality. This needs to work on both the browser and server
 *  side for the engine to be able to run on both sides. On the server side use V8.
 */
define(['underscore', 'console'], function (_, console) {
    'use strict';
    // Simulation - ability to simulate decision tables processing by providing inputs and obtaining the appropriate
    // results/outputs (debugging).
    // Audit Trail - provide an audit trail to know which rules were applied during iterations of the decision tables
    // (for support, auditing and once again debugging)

    function ExpressionFactory(extensions, key) {
        this.extensions = extensions || "";
        var s = "(function () {\n" +
            "    'use strict';\n" +
            //"    var $that = this;\n" +
            "    // extensions start\n" +
            this.extensions + "\n" +
            "    // extensions end\n" +
            "    return {\n" +
            "       condition: function(expression, name) {\n" +
            "           return eval(\n" +
            "               \"(function () {\\n return \" + expression + \";\\n})\\n\"\n +" +
            "               \"//@ sourceURL=http://decisionTables/\" + name\n" +
            "           );\n" +
            "       },\n" +
            "       action: function(expression, name) {\n" +
            "           return eval(\n" +
            "               \"(function () {\\n \" + expression + \"\\n})\\n\"\n +" +
            "               \"//@ sourceURL=http://decisionTables/\" + name\n" +
            "           );\n" +
            "       }\n" +
            "   };\n" +
            "})()\n" +
            "//@ sourceURL=http://decisionTables/" + key + "/extensions";

        var methods = eval(s);

        this.action = methods.action;
        this.condition = methods.condition;
    }

    function Evaluator(expression, name, expressionFactory) {
        this.expression = expression;
        try {
            this.fn = expressionFactory(expression, name);
            /*this.fn = eval(
                "(function () {\n 'use strict';\n return " + expression + ";\n})\n" +
                "//@ sourceURL=http://decisionTables/" + name
            );*/
        } catch (e) {
            this.fn = null;
            this.error = e;
            //throw new Error("Compilation of '" + this + "' failed: " + e.message);
        }
    }
    Evaluator.prototype.evaluate = function (scope) {
        // execute the expression using the scope object as "this"
        try {
            return this.fn.apply(scope);
        } catch (e) {
            throw new Error("Evaluation of '" + this + "' failed: " + e.message);
        }
    };
    Evaluator.prototype.invoke = function (scope) {
        // execute the expression using the scope object as "this"
        try {
            this.fn.apply(scope);
        } catch (e) {
            throw new Error("Invocation of '" + this + "' failed: " + e.message);
        }
    };
    Evaluator.prototype.toString = function () {
        return this.expression;
    };
    Evaluator.evaluatorFactory = function (prefix, expressionFactory) {
        return function(expression, index) {
            var name =  prefix + (index + 1);
            return new Evaluator(expression, name, expressionFactory);
        };
    };

    function DecisionTable(table, key) {
        // create an Evaluator object for each condition and action expression
        var expressionFactory = new ExpressionFactory(table.extensions, key);
        this.conditions = _.map(table.conditions,
            Evaluator.evaluatorFactory(key + "/conditions/", expressionFactory.condition));
        this.actions = _.map(table.actions,
            Evaluator.evaluatorFactory(key + "/actions/", expressionFactory.action));
        this.rules = table.rules;
        this.extensions = table.extensions;
        // TODO validate all action indexes in rules are < actions.length
        // TODO validate all rule.values.length === conditions.length
    }

    DecisionTable.prototype.watch = function(scope) {
        return this.conditions.map(function (c) {
            return c.evaluate(scope);
        });
    };

    //  compare a condition evaluation result and a rule value (cannot be swapped!)
    DecisionTable.prototype.compareConditionToRule = function (conditionValue, ruleValue) {
        // ruleValue is always a string

              // don't care
        return _.isNull(ruleValue)      ||
               _.isEmpty(ruleValue)     ||
               _.isUndefined(ruleValue) ||
              // boolean
              (ruleValue === "false" && !conditionValue) ||
              (ruleValue === "true"  &&  conditionValue) ||
              // string
              (_.isString(conditionValue) && ruleValue === conditionValue) ||
              // number
              (_.isNumber(conditionValue) && parseFloat(ruleValue) === conditionValue);
            //|| _.isEqual(conditionValue, ruleValue);
    };

    // evaluate all conditions against a scope
    DecisionTable.prototype.conditionValues = function (scope) {
        return this.conditions.map(function (c) {
            return {
                condition: c,
                value: c.evaluate(scope)
            };
        });
    };

    DecisionTable.prototype.ruleMatches = function (conditionValues) {
        var compare = this.compareConditionToRule;
        // go through each rule and check if the value match the condition values
        return this.rules.map(function (rule) {
            // zip the 2 arrays (conditions values + rule values) to evaluate rule matching
            //  pair by pair - stops once compare fails.
            var pairs = _.zip(conditionValues, rule.values);
            return {
                rule: rule,
                match: _.all(pairs, function (pair) {
                    return compare(         // order is very important here!
                        pair[0].value,      // condition value
                        pair[1]);           // rule value
                }, true)
            };
        });
    };

    DecisionTable.prototype.actionsIndexes = function (ruleMatches) {
        // return the set of actions depending on the rule matches
        return _.chain(ruleMatches)
            .filter(function (m) {
                return m.match;
            })
            .map(function (m) {
                return _.reduce(m.rule.actions, function (result, action, index) {
                    if (action) {
                        result.push(index);
                    }
                    return result;
                }, []);
            })
            .flatten()
            .uniq()
            .sortBy()
            .value();
    };

    DecisionTable.prototype.executeActions = function (indexes, scope) {
        var actions = this.actions;
        //this.logActions(indexes);
        _.each(indexes, function (i) {
            var action = actions[i];
            action.invoke(scope);
        });
    };

    /*DecisionTable.prototype.logActions = function(indexes) {
        var actionsCodeArray = [];
        for (var i = 0; i < indexes.length; i++) {
            var expr = this.actions[indexes[i]].expression;
            actionsCodeArray.push(expr);
        }
        var indexesPlusInfo = _.flatten(_.zip(indexes, actionsCodeArray));
        if (!_.isEmpty(indexesPlusInfo) && indexesPlusInfo.length > 0) {
            console.log(indexesPlusInfo);
        }
    };*/

    DecisionTable.prototype.evaluate = function (scope) {
        var matches = this.ruleMatches(this.conditionValues(scope));
        var actionsIndexes = this.actionsIndexes(matches);
        this.executeActions(actionsIndexes, scope);
    };

    return DecisionTable;
});
/* jshint ignore:end */
