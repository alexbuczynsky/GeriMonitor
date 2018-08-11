var DB_API = require('../../databases/db_api/db_api.js');

module.exports = function(req, res) {
    res.render('nurse_view.ejs', {
        user: req.user,
    })
}