

function Isupport() {
    var self = this;
    self.config = {};

    self.update([
        'CHANTYPES=#',
        'CHANMODES=beIR,k,l,imnpstaqr',
        'PREFIX=(ov)@+'
    ]);
}

Isupport.mappers = {
    PREFIX : function(value) {
        var m = value.match(/^\((.+)\)(.*)$/);
        var modes = m[1];
        var prefixes = m[2];

        var result = {};
        modes.split('').forEach(function(mode, i) {
            result[mode] = prefixes[i];
        });
        
        return result;
    },
    CHANMODES : function(value) {
        return value.split(',').map( function(modes) {
            return modes.split('');
        });
    }
    // more
};

Isupport.prototype.update = function(params) {
    var self = this;

    params.forEach(function(keyValue) {
        var keyValues = keyValue.split('=');
        var key = keyValues[0];
        var value = keyValues.slice(1).length > 0 ?
            keyValues.slice(1).join('') : true;

        var mapper = Isupport.mappers[key] || function (value) { return value; };
        self.config[ key ] = mapper(value);
    });
};


module.exports = Isupport;
