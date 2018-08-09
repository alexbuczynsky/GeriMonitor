let DB_API = module.parent.exports;
let mainDB = DB_API.db.mainDB;

module.exports = function getAll() {
    return new Promise(function (resolve, reject) {
        mainDB.all(`SELECT * FROM event_snapshots`, function (err, zones) {
            if (err) {
                console.error(new Error(err))
                return reject(err);
            }
            resolve(zones);
        })
    })
};