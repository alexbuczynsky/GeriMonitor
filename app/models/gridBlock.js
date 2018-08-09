var moment = require('moment-timezone');

const Xmax = 7818;
const Ymax = 7735;
module.exports = class gridBlock {
    constructor(x,y) {
        this.x = this.setX(x) || null;
        this.y = this.setY(y) || null;
        this._lastUpdate();
    }

    setX(x){
        if(x<=Xmax && x>=0){
            this.x = x;
            this._lastUpdate();
        }else{
            throw "x out of range"
        }
    }
    setY(y){
        if(x<=Xmax && x>=0){
            this.y= y;
            this._lastUpdate();
        }else{
            throw "y out of range"
        }   
    }

    _lastUpdate(){
        this.last_update = moment().utc().format();
    }
}