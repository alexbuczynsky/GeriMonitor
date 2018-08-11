"use strict";

// CONNECT TO ALL DATABASES
var path = require('path')
var sqlite3 = require('sqlite3')
const mainDB_path = path.resolve(__dirname, '../main.db')
var mainDB = new sqlite3.Database(mainDB_path, 'OPEN_READWRITE')

const EventEmitter = require('events').EventEmitter;
module.exports.db_events = new EventEmitter();

module.exports = Object.assign({ // Common Functions used throughout the API (NEEDS TO LOAD FIRST)
    propertyValueNameSeperator: require('./propertyValueNameSeperator')
}, module.exports)

module.exports.errorHandling = { //these function deal with logging errors
    requireParamsRejection: require('./errorHandling/requireParamsRejection.js')
}

module.exports.db = {
    mainDB
}

module.exports.cameras = { //Contains all device related functions
    // getInfo: require('./db_api/devices/getInfo'),
    getAll: require('./cameras/getAll'),
    // delete: require('./db_api/devices/delete'),
    add: require('./cameras/add'),
    // modify: require('./db_api/devices/modify'),
};

module.exports.machine_states = { //Contains all machine state related functions
    getAll: require('./machine_states/getAll')
};

module.exports.users = { //Contains all device related functions
    // add: require('./db_api/devices/add'),
};

module.exports.snapshots = { //Contains all device related functions
    add: require('./snapshots/add'),
};

module.exports.zones = {
    add: require('./zones/add'),
    getAll: require('./zones/getAll')
}

module.exports.events = {
    add: require('./events/add'),
    getAll: require('./events/getAll')
}