let DB_API = module.parent.exports;
let mainDB = DB_API.db.mainDB;
const requireParamsRejection = DB_API.errorHandling.requireParamsRejection;
const propertyValueNameSeperator = DB_API.propertyValueNameSeperator;

module.exports = function add(params) {
    return new Promise(function (resolve, reject) {
        if (params.time === undefined) reject(requireParamsRejection('time'))
        if (params.event_type === undefined) reject(requireParamsRejection('event_type'))
        if (params.zone_name === undefined) reject(requireParamsRejection('zone_name'))
        if (params.camera_id === undefined) reject(requireParamsRejection('camera_id'))
        

        const tableName = 'events';
        const columns = propertyValueNameSeperator(params);
        const sqlCommand = `INSERT or REPLACE INTO ${tableName} (${columns.propertyNames}) values(${Array(columns.propertyValues.length).fill('?')})`;
        mainDB.run(sqlCommand, columns.propertyValues, function (err, row) {
            if (err) {
                console.error(new Error(err))
                reject(err);
            } else {
                params.event_id = this.lastID;
                resolve(params);
                DB_API.db_events.emit('userFilesChanged');
            }
        })

    })
};