define(['moment'],
    function (moment) {
        return function (jsonDateInUtc) {
            return moment(moment(jsonDateInUtc).format("YYYY-MM-DDTHH:mm:ss") + 'Z');
        };
    }
);
