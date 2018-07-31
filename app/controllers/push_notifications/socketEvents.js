// Process socketIO events...
var moment = require('moment-timezone');

//GET APPLICATION SETTINGS FROM PACKAGE.json

const EventEmitter = require('events').EventEmitter;
var push_events = new EventEmitter();
var DB_API = require(`../../databases/db_api/db_api`);

module.exports.push_events = push_events;

exports.startListening = function(server){
  var socketIO = require('socket.io')(server,{
    'pingTimeout': 15000
  });
  //Subscribe to events...

  push_events.on('deviceOnline', device => {
    let timeStamp = moment().tz("UTC").format('YYYY-MM-DD HH:mm:ss');
    socketIO.emit('deviceOnline',JSON.stringify({
      title: `${device.name}`,
      message: `Device Online at ${timeStamp}`,
      device: device
    }))
  })

  push_events.on('motionDetected', motionEvent => {
    let timeStamp = moment().tz("UTC").format('YYYY-MM-DD HH:mm:ss');
    socketIO.emit('motionDetected',JSON.stringify({
      title: `Motion Alert for Camera ${motionEvent.camera_name}`,
      message: `Motion Detected for Camera ${motionEvent.camera_name} in zone ${motionEvent.zone_name} at ${timeStamp}`,
      device: motionEvent
    }))
  })

  push_events.on('deviceAdded', device => {
    socketIO.emit('deviceAdded',device)
  })

  push_events.on('deviceRemoved', device => {
    socketIO.emit('deviceRemoved',device)
  })

  push_events.on('polling_completed',device => {
    let timeStamp = moment().tz("UTC").format('YYYY-MM-DD HH:mm:ss');
    socketIO.emit('polling_completed',JSON.stringify({
      title: `${device.name}`,
      message: `Polling Completed at ${timeStamp}`,
      device: device
    }))
  })

  push_events.on('deviceOffline', device => {
    let timeStamp = moment().tz("UTC").format('YYYY-MM-DD HH:mm:ss');
    socketIO.emit('deviceOffline',JSON.stringify({
      title: `${device.name}`,
      message: `Device Offline at ${timeStamp}`,
      device: device
    }))
  })

  push_events.on('error', error => {
    let timeStamp = moment().tz("UTC").format('YYYY-MM-DD HH:mm:ss');
    socketIO.emit('error',JSON.stringify({
      'timestamp': timeStamp,
      'error':error
    }))
  })



  socketIO.on('requestDHCPdevices',() => {
    const netList = require('network-list');
    var networkDevices = [];
    netList.scan({}, (err, devices) => {
        devices = devices.filter(x => x.alive == true);
        socketIO.emit('RetrievedDHCPDevices',devices)
    });
    netList.scanEach({}, (err, device) => {
      if(device.alive) networkDevices.push(device);
    });
  })

  //For talking to user interface when it needs info from server
  socketIO.sockets.on('connection',function(socket){

    socket.on('getSerialPorts',function(cb){
      let SerialPort = require('serialport');
      SerialPort.list(function (err, ports) {
        if (err) {
          console.error(err)
          return
        }
        cb(ports);
      })
    })
  })
}