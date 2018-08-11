var moment = require('moment-timezone');
var DB_API = require('../databases/db_api/db_api');
const EventEmitter = require('events').EventEmitter;


module.exports = class machine_states {
    constructor() {
        this.states = [];
        this.events = new EventEmitter();
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

    setState(name,state){
        //sets the state of the current in states array
        const index = this.states.findIndex(x => x.name == name);
        this.states[index].setTripped(state);

        this.events.emit("motion_event",{'name':name,'tripped':state});
    }

    getState(name){
        let currentStates = this.states;
        let stateOfDesiredObject = null;
        currentStates.forEach(state => {
            if(name == state.name){
                stateOfDesiredObject = state.tripped;
            }
        })
        console.log(`state ${name}:${stateOfDesiredObject}`)
        return stateOfDesiredObject;
    }

    getAllStates(){
        let currentStates = this.states;
        let objectStates = {};
        currentStates.forEach(state => {
            objectStates[state.name] = state.tripped;
        })
        return objectStates;    
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
        this.tripped = trippedState;
        this._lastUpdate();
    }

    seconds_since_tripped(){
        return moment.duration(moment().utc().diff(this.last_tripped_time)).asSeconds();
    }

    _lastUpdate(){
        this.last_tripped_time = moment().utc().format();
    }
}