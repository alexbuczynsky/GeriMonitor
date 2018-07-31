let DB_API = module.parent.exports;
let mainDB = DB_API.db.mainDB;
const requireParamsRejection = DB_API.errorHandling.requireParamsRejection;
const propertyValueNameSeperator = DB_API.propertyValueNameSeperator;

module.exports = function add(params) {
    return new Promise(function (resolve, reject) {
        if (params.camera_id === undefined) reject(requireParamsRejection('camera_id'))
        if (params.name === undefined) reject(requireParamsRejection('name'))
        if (params.x1 === undefined) reject(requireParamsRejection('x1'))
        if (params.y1 === undefined) reject(requireParamsRejection('y1'))
        if (params.x2 === undefined) reject(requireParamsRejection('x2'))
        if (params.y2 === undefined) reject(requireParamsRejection('y2'))
        if (params.threshold === undefined) reject(requireParamsRejection('threshold'))
        if (params.sensitive === undefined) reject(requireParamsRejectisensitive('sensitive'))

        const tableName = 'zones';
        const columns = propertyValueNameSeperator(params);
        const sqlCommand = `INSERT or REPLACE INTO ${tableName} (${columns.propertyNames}) VALUES(${Array(columns.propertyValues.length).fill('?')})`;
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