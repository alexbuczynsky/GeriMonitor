var DB_API = require('../../databases/db_api/db_api.js');

module.exports = function(req, res) {
    res.render('login.ejs', {
        user: req.user,
        message: req.flash('loginMessage')
    })
}