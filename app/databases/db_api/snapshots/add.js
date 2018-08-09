let DB_API = module.parent.exports;
let mainDB = DB_API.db.mainDB;
const requireParamsRejection = DB_API.errorHandling.requireParamsRejection;
const propertyValueNameSeperator = DB_API.propertyValueNameSeperator;

module.exports = function add(params) {
    return new Promise(function (resolve, reject) {
        if (params.camera_id === undefined) reject(requireParamsRejection('camera_id'))
        if (params.event_id === undefined) reject(requireParamsRejection('event_id'))
        if (params.time === undefined) reject(requireParamsRejection('time'))
        // if (params.snapshot_file_name === undefined) reject(requireParamsRejection('snapshot_file_name'))
        // if (params.snapshot_file_extension === undefined) reject(requireParamsRejection('snapshot_file_extension'))
        params.snapshot_file_name = `camera_${params.camera_id}-event_${params.event_id}-time_${params.time}`;
        params.snapshot_file_extension = `jpg`;

        const tableName = 'snapshots';
        const columns = propertyValueNameSeperator(params);
        const sqlCommand = `INSERT or REPLACE INTO ${tableName} (${columns.propertyNames}) values(${Array(columns.propertyValues.length).fill('?')})`;
        mainDB.run(sqlCommand, columns.propertyValues, function (err, row) {
            if (err) {
                console.error(new Error(err))
                reject(err);
            } else {
                params.snapshot_id = this.lastID;
                resolve(params);
                DB_API.db_events.emit('userFilesChanged');
            }
        })

    })
};