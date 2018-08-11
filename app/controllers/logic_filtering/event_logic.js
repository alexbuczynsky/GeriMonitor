/*
This will be for monitoring the events
*/

const machine_states_class = require('../../models/machine_states');

module.exports.start_listening = async function start_listening(){

    var machine_states = new machine_states_class();
    await machine_states.init();

    console.log('machine states',machine_states);
}
