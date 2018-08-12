/*
This will be for monitoring the events
*/

const machine_states_class = require('../../models/machine_states');
var push_events = require('../push_notifications/socketEvents.js').push_events;
var moment = require('moment-timezone');

const waitAfterSittingForAlarm = 5000;
var machine_states = {};
const waitSittingNoMotion = 5000;
module.exports.get_machine_states = function(){
    return machine_states;
}

module.exports.start_listening = async function start_listening(){

    machine_states = new machine_states_class();
    await machine_states.init();

    var machine_states_events = machine_states.events.on("motion_event", info =>{
        /*
            info = {
                name: name,
                tripped: bool
            }
        */
       push_events.emit("machine_states_motion_event",info)
       switch(info.name){
           case "alarm":
                push_events.emit("alarm_state",info.tripped);
                break;
            default:
                console.log(`${moment().format("HH:mm:ss:sss")} - setting machine state ${info.name} to ${info.tripped}`)
       }
    })

    push_events.on("alarm_confirmed_from_GUI",() => {
        machine_states.setState("person_in_room",true);
        machine_states.setState("alarm",false);
    })

    // ZONE 1
    push_events.on("motion Pillow", () => {
        if(machine_states.getState("pillow_instant").seconds_since_tripped() < 10){
            machine_states.setState("pillow_instant",true); setTimeout(() => {machine_states.setState("pillow_instant",false)},5000);
            setTimeout(() => {
                const above_bed_motion = machine_states.states.find(x => x.name == "above_bed_motion");
                // console.log('above_bed_motion',above_bed_motion,'seconds',above_bed_motion.seconds_since_tripped())
                if(above_bed_motion.seconds_since_tripped()*1000 > waitSittingNoMotion){
                    machine_states.setState("sitting_detected",   false);
                    machine_states.setState("alarm",              false);
                    machine_states.setState("person_in_room",     false);
                    machine_states.setState("entry_motion",       false);
                }
            },waitSittingNoMotion)
        }
    })

    // ZONE 2
    push_events.on("motion Above Bed", () => {
        if(machine_states.getState("above_bed_motion").seconds_since_tripped() < 10){
            machine_states.setState("above_bed_motion",true); setTimeout(() => {machine_states.setState("above_bed_motion",false)},5000);
            if(machine_states.getState("person_in_room") == false || machine_states.getState("person_in_room") == "false"){
                machine_states.setState("sitting_detected", true);
                setTimeout(() => {
                    if(machine_states.getState("person_in_room") == false || machine_states.getState("person_in_room") == "false"){
                        console.log("WE HAVE ARRIVED!!!", machine_states.getState("alarm"))
                        machine_states.setState("alarm", true);
                    }
                    machine_states.setState("sitting_detected", false);
                    machine_states.setState("above_bed_motion",false);
                },waitAfterSittingForAlarm)
            }
        }
    })

    // ZONE 3
    push_events.on("motion Secondary", () => {
        if(machine_states.getState("secondary_motion_instant").seconds_since_tripped() < 10){
            machine_states.setState("secondary_motion_instant",true); setTimeout(() =>{machine_states.setState("secondary_motion_instant",false)},5000);
            // if(machine_states.getState("entry_motion")){
            if(true){
                machine_states.setState("person_in_room",   true);
                machine_states.setState("entry_motion",     false);
                machine_states.setState("sitting_detected", false);
                machine_states.setState("alarm",            false);
            }
        }
        
    })
    
    // ZONE 4
    push_events.on("motion Door", () => {
        machine_states.setState("door_instant",true); setTimeout(() => {machine_states.setState("door_instant",false)},5000);
        machine_states.setState("entry_motion", true);
        //machine_states.setState("person_in_room",true);
        
        if(!machine_states.getState("person_in_room")){
            setTimeout(() => {
                machine_states.setState("entry_motion",false);
            }, 15000)
        }


    })
    



    // used for setting machine states
    /*
        Potential Names:
        - person_in_room
        - entry_motion
        - pillow
        - sitting_detected
        - patient_laying_down
        - alarm
    */
}


