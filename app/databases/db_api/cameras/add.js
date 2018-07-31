let DB_API = module.parent.exports;
let mainDB = DB_API.db.mainDB;
const requireParamsRejection = DB_API.errorHandling.requireParamsRejection;
const propertyValueNameSeperator = DB_API.propertyValueNameSeperator;

module.exports = function add(params) {
    return new Promise(function (resolve, reject) {
        if (params.name === undefined) reject(requireParamsRejection('name'))
        if (params.ip_address === undefined) reject(requireParamsRejection('ip_address'))
        if (params.port === undefined) reject(requireParamsRejection('port'))
        if (params.username === undefined) reject(requireParamsRejection('username'))
        if (params.password === undefined) reject(requireParamsRejection('password'))

        const tableName = 'cameras';
        const columns = propertyValueNameSeperator(params);
        const sqlCommand = `INSERT INTO ${tableName} (${columns.propertyNames}) values(${Array(columns.propertyValues.length).fill('?')})`;
        mainDB.run(sqlCommand, columns.propertyValues, function (err, row) {
            if (err) {
                console.error(new Error(err))
                reject(err);
            } else {
                params.zone_id = this.lastID;
                resolve(params);
                DB_API.db_events.emit('userFilesChanged');
            }
        })

    })
};