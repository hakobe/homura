
var ModeParser = Object.create({
    parse : function(modes, params, paramModes) {
        var results = [];
        var direction;
        modes.split('').forEach( function(c) {
            if (c.match(/^[+-]$/)) {
                direction = c === '+' ? 'add' : 'remove';
                return;
            }

            var param;
            if (
                   paramModes
                && paramModes[direction]
                && paramModes[direction].indexOf(c) !== -1
            ) {
                param = params.shift();
            }
            else {
                param = null;
            }
            results.push([ direction, c, param ]);
        });

        return results;
    }
});

module.exports = ModeParser;
