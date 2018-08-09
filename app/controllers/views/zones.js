var DB_API = require('../../databases/db_api/db_api.js');

module.exports = async function(req, res) {
    let zones = await DB_API.zones.getAll();
    res.render('zones.ejs', {
        user: req.user,
        zones: zones
    })
}