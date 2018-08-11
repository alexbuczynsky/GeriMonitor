var moment = require('moment-timezone');
var DB_API = require('../databases/db_api/db_api');
module.exports = class machine_states {
    constructor() {
        this.states = [];
        this._lastUpdate();
    }

    init(){
        var mainObj = this;
        return new Promise(async (resolve,reject) => {
            try{
                const machine_states = await DB_API.machine_states.getAll();
                const machine_states_classed = machine_states.map(state => new machine_state(state));
                mainObj.states = machine_states_classed
                resolve(machine_states_classed);
            }catch(err){
                reject(err);
            }
            
        });
    }
    
    _lastUpdate(){
        this.last_update = moment().utc().format();
    }
}



class machine_state {
    constructor(params) {
        this.id = params.state_id; //int
        this.name = params.state_name; //string
        this.tripped = params.tripped; //bool
        this.last_tripped_time = null; //datetime
        this._lastUpdate();
    }

    setTripped(trippedState){
        DB_API.machine_states.set({
            state_name:this.name,
            tripped:trippedState,
            last_tripped_time: this._lastUpdate()
        })
    }

    seconds_since_tripped(){
        return moment.duration(moment().utc().diff(this.last_tripped_time)).asSeconds();
    }

    _lastUpdate(){
        this.last_tripped_time = moment().utc().format();
    }
}