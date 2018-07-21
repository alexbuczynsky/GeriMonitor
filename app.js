var express = require('express');
var app = express();
var path = require('path');

//PUBLIC RESOURCES
app.use('/css/bootstrap', express.static( path.join(__dirname,'/node_modules/bootstrap/dist/css') ));
app.use('/js/bootstrap',  express.static( path.join(__dirname,'/node_modules/bootstrap/dist/js')  ));
app.use('/js/moment',     express.static( path.join(__dirname,'/node_modules/moment-timezone/builds')  ));
app.use('/js/moment',     express.static( path.join(__dirname,'/node_modules/moment/min')  ));
app.use('/js/jquery',     express.static( path.join(__dirname,'/node_modules/jquery/dist')        ));
app.use('/',              express.static( path.join(__dirname,'/web/public')        ));

app.use(express.static('public'));

var morgan = require('morgan'); //web request logging
app.use(morgan('dev'))

app.set('view engine','ejs');
app.set('views', __dirname + '/app/views');

app.use(require(__dirname + '/app/routes.js')); //specifies the path for the api to function
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('cookie-parser')());

//START SERVER
app.listen(3000, function(){
  console.log('Example app listening on port 3000!');
})

//VERBOSE LOGGING OF REJECTIONS
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

exports = app;