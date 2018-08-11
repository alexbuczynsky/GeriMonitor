// Process socketIO events...
var moment = require('moment-timezone');

//GET APPLICATION SETTINGS FROM PACKAGE.json

const EventEmitter = require('events').EventEmitter;
var push_events = new EventEmitter();
var DB_API = require(`../../databases/db_api/db_api`);

module.exports.push_events = push_events;
module.exports.alarm_interval = {};

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

  push_events.on('alarm_state', alarm_state => {
    let timeStamp = moment().tz("UTC").format('YYYY-MM-DD HH:mm:ss');

    if(alarm_state.alarm_state == true){
      exports.alarm_interval = setInterval(() => {
        notification_sound()
      },2000)
    }else{
      try{
        clearInterval(exports.alarm_interval);
      }catch(err){
        console.log(Error(err))
      }
    }
    socketIO.emit('alarm_state',JSON.stringify({
      'timestamp': timeStamp,
      'alarm_state':alarm_state
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

    socket.on('updateZone',function(params,cb){
      let SerialPort = require('serialport');
      SerialPort.list(function (err, ports) {
        if (err) {
          console.error(err)
          return
        }
        cb(ports);
      })
    })

    socket.on('alarm_confirmed_from_GUI',function(){
      push_events.emit('alarm_state',false);
      console.log("alarm_confirmed_pushed")
    })

  })
}



function notification_sound(){
  var player = require('play-sound')(opts = {});
  try{
    player.play('../../models/alert_tones/notification.mp3', function(err){
      if (err) throw err
    })
  }catch(err){
    //console.log("When running on raspberry pi, go download Omxplayer to play media file notifications https://elinux.org/Omxplayer")
  }
}