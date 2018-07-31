var DB_API = require('../../databases/db_api/db_api.js');

module.exports = async function(req, res) {
    let allEvents = await DB_API.events.getAll();
    res.render('events.ejs', {
        user: req.user,
        events: allEvents
    })
}