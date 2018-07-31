var moment = require('moment-timezone');
module.exports = class position {
    constructor(x,y,z) {
        this.x = x || null;
        this.y = y || null;
        this.z = z || null;
        this._lastUpdate();
    }

    setX(x){this.x = x}
    setY(y){this.y = y}
    setZ(z){this.z = z}

    _lastUpdate(){
        this.last_update = moment().utc().format();
    }
}