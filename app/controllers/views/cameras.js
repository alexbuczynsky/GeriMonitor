var DB_API = require('../../databases/db_api/db_api.js');

module.exports = async function(req, res) {
    let allCameras = await DB_API.cameras.getAll();
    res.render('cameras.ejs', {
        user: req.user,
        cameras: allCameras
    })
}