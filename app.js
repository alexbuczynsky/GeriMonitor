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

var morgan = require('morgan'); //web request logging
app.use(morgan('dev'))

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

//START SERVER
server.listen(3000, function(){
  console.log('Example app listening on port 3000!');
})

//Start sync with cameras
require('./app/models/test_camera')



//VERBOSE LOGGING OF REJECTIONS
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

exports = app;