/*global define, console */
define(['underscore',
        'jquery',
        'Config/decisionTable',
        'text!decisionTables/POS.DecisionTable.Payment.json',
        'text!decisionTables/SR.DecisionTable.Charge.json',
        'text!decisionTables/SR.DecisionTable.ChargeToAuthorisation.json',
        'text!decisionTables/SR.DecisionTable.Payment.json',
        'text!decisionTables/SR.DecisionTable.ServiceStatus.json',
        'text!decisionTables/SR.DecisionTable.Workflow.json'
    ],

    function (_, $, DecisionTable,
              posDTPaymentJson, srDTChargeJson, srDTChargeToAuthorisationJson, srDTPaymentJson, srDTServiceStatusJson, srDTWorkflowJson) {
        'use strict';

        function cleanJson(input) {
            var randNum = Math.floor((Math.random() * 999999) + 1);
            var markerTokenStr = "&.crlf." + randNum + ".&";
            var file = input;

            file = file.replace(/\r\n/gm, markerTokenStr);

            file = file.replace(/\r/gm, "\\n");
            file = file.replace(/\n/gm, "\\n");

            file = file.replace(new RegExp(markerTokenStr,'gm'), "\r\n");

            return file;
        }

        function loadDecisionTable(key, callback) {
            var filePath = 'decisionTables/' + key + '.json';

            console.info('filePath = ' + filePath);
            $.getJSON(filePath, function (json) {
                callback(json);
            }).fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Request Failed: " + err);
            });
        }

        function toDecisionTable(input,key){
            var json =cleanJson(input);
            var inputJson = JSON.parse(json);

            // Temp ---------------------------
            var newTable = {
                actions:_.map(inputJson.actions, function (action) {
                    return action.expression;
                }),
                conditions:_.map(inputJson.conditions, function (condition) {
                    return condition.expression;
                }),
                rules:inputJson.rules,
                extensions:inputJson.extensions
            };
            //End Temp

            return new DecisionTable(newTable, key);
        }

        return {
            posPaymentDt: toDecisionTable(posDTPaymentJson, 'POS.DecisionTable.Payment'),
            srChargeDt: toDecisionTable(srDTChargeJson, 'SR.DecisionTable.Charge'),
            chargeToAuthorisationDt: toDecisionTable(srDTChargeToAuthorisationJson, 'SR.DecisionTable.ChargeToAuthorisation'),
            srPaymentDt:toDecisionTable(srDTPaymentJson, 'SR.DecisionTable.Payment'),
            serviceStatusDt: toDecisionTable(srDTServiceStatusJson, 'SR.DecisionTable.ServiceStatus'),
            workflowDt: toDecisionTable(srDTWorkflowJson, 'SR.DecisionTable.Workflow'),
            loadDecisionTable: loadDecisionTable
        };
    }
);
