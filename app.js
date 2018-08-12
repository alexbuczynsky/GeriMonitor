var express = require('express');
var app = express();
var path = require('path');
var passport = require('passport');

//PUBLIC RESOURCE FOLDERS
const publicPaths = {
  // PUBLIC PATH            : // LOCAL PATH
  '/css/bootstrap'          : 'node_modules/bootstrap/dist/css',
  '/js/bootstrap'           : 'node_modules/bootstrap/dist/js',
  '/js/moment-timezone'     : 'node_modules/moment-timezone/builds',
  '/js/moment'              : 'node_modules/moment/min',
  '/js/jquery'              : 'node_modules/jquery/dist',
  '/js/chart-js/'           : 'node_modules/chart.js/dist',
  '/'                       : 'web/public'
}
Object.keys(publicPaths).forEach(publicPath =>{
  const localPath = publicPaths[publicPath];
  app.use(publicPath, express.static( path.join(localPath) ));
})

app.use(express.static('public'));

// var morgan = require('morgan'); //web request logging
// app.use(morgan('dev'));

app.set('view engine','ejs');
app.set('views', __dirname + '/app/views');


app.use(require('express-session')({
  secret: 'some key',
  resave: false,
  saveUninitialized: false
}));

// flash messages to the user such as "wrong username / password combination"
var flash    = require('connect-flash');
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));

// specify routes and user authentication
app.use(require(__dirname + '/app/routes.js')(app, passport));


var socketEvents = require('./app/controllers/push_notifications/socketEvents');
var server = require('http').createServer(app);
socketEvents.startListening(server);
// setInterval(() => {
//   socketEvents.push_events.emit("alarm_state",true);
//   setTimeout(() => socketEvents.push_events.emit("alarm_state",false),4000);
// },5000)

//START SERVER
server.listen(3000, function(){
  console.log('Example app listening on port 3000!');
})




//Start sync with cameras
var test_camera = require('./app/models/test_camera');

var DB_API = require('./app/databases/db_api/db_api');

//start monitoring machine states
var event_logic = require('./app/controllers/logic_filtering/event_logic');
event_logic.start_listening();




try {
  const Gpio = require('onoff').Gpio;
  const buzzer = new Gpio(17, 'out');
  setInterval(()=> {
    buzzer.writeSync(1);
    setTimeout(()=>{
      buzzer.writeSync(0);
    },1000);
  },5000)
}catch(err){
  //console.log(err)
}



// setInterval(() => {
//   test_camera.cameras.forEach(camObj => {

//     camObj.getMotionDetectionSettings().then(MotionDetectWindows => {
//       camObj.settings.motion.forEach(zone => {
//         const zoneOptions = {
//           zone_id: zone.Id,
//           camera_id: camObj.camera_id,
//           name: zone.Name,
//           x1: zone.Window[0],
//           y1: zone.Window[1],
//           x2: zone.Window[2],
//           y2: zone.Window[3],
//           threshold: zone.Threshold,
//           sensitive: zone.Sensitive
//         };
//         DB_API.zones.add(zoneOptions)
//       })
//       // console.log('Dejitter', camObj.settings.EventHandler.Dejitter);
//       // camObj.setEventHandlerConfig([{
//       //   name: 'Dejitter',
//       //   value: 0
//       // }])

//       // camObj.getEventHandlerConfig([]).then(info => {
//       //   console.log(info)
//       // })
//     })
//   })
// }, 30*1000)



//VERBOSE LOGGING OF REJECTIONS
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

exports = app;