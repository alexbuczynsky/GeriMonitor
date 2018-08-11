/*
This will be for monitoring the events
*/

const machine_states_class = require('../../models/machine_states');
var push_events = require('../push_notifications/socketEvents.js').push_events;
var moment = require('moment-timezone');

const waitAfterSittingForAlarm = 5000;
const waitSittingNoMotion = 5000;

module.exports.start_listening = async function start_listening(){

    var machine_states = new machine_states_class();
    await machine_states.init();

    var machine_states_events = machine_states.events.on("motion_event", info =>{
        /*
            info = {
                name: name,
                tripped: bool
            }
        */
       switch(info.name){
           case "alarm":
                push_events.emit("alarm_state",info.tripped);
                break;
            default:
                console.log(`${moment().format("HH:mm:ss:sss")} - setting machine state ${info.name} to ${info.tripped}`)
       }
    })

    // ZONE 1
    push_events.on("motion Pillow", () => {
        setTimeout(() => {
            const above_bed_motion = machine_states.states.filter(x => x.name == "above_bed_motion");
            if(above_bed_motion.seconds_since_tripped < waitSittingNoMotion){
                machine_states.setState("sitting_detected",   false);
                machine_states.setState("alarm",              false);
                machine_states.setState("person_in_room",     false);
                machine_states.setState("entry_motion",       false);
            }
        },waitSittingNoMotion)
    })

    // ZONE 2
    push_events.on("motion Above Bed", () => {
        machine_states.setState("above_bed_motion",true);
        if(!machine_states.getState("person_in_room")){
            machine_states.setState("sitting_detected", true);
            setTimeout(() => {
                if(!machine_states.getState("person_in_room")){
                    machine_states.setState("alarm", true);
                }
                machine_states.setState("sitting_detected", false);
                machine_states.setState("above_bed_motion",false);
            },waitAfterSittingForAlarm)
        }
    })

    // ZONE 3
    push_events.on("motion Secondary", () => {
        if(machine_states.getState("entry_motion")){
            machine_states.setState("person_in_room",   true);
            machine_states.setState("entry_motion",     false);
            machine_states.setState("sitting_detected", false);
            machine_states.setState("alarm",            false);
        }
    })
    
    // ZONE 4
    push_events.on("motion Door", () => {
        machine_states.setState("entry_motion", true);
        
        if(!machine_states.getState("person_in_room")){
            // setTimeout(() => {
            //     machine_states.setState("entry_motion",false);
            // }, 5000)
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


