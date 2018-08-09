var DB_API = require(process.cwd()+'/app/databases/db_api/db_api.js');

module.exports = async function(req, res) {
    res.json(await DB_API.cameras.getAll())
}