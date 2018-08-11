var DB_API = require('../../databases/db_api/db_api.js');

module.exports = function(req, res) {
    try{
        const machine_states = require('../logic_filtering/event_logic.js').get_machine_states();
        console.log(machine_states)
        res.render('nurse_view.ejs', {
            user: req.user,
            machine_states:machine_states.states
        })
    }catch(err){
        res.send(err)
    }
    
}