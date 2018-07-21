var express = require('express');

var router = express.Router();

var moment = require('moment-timezone');

//Logging Middleware
router.use(function timeLog (req, res, next) {
    //console.log(req._parsedOriginalUrl.path,'Time: ', moment().tz(moment.tz.guess()).format('HH:MM:SS z'))
    next()
})

var path = require('path');

const routes = {
    '/': { type: 'get' ,  path: 'app/controllers/views/index.js' }
}

console.log('routes:\n',require('prettyjson').render(routes))

Object.keys(routes).forEach(route => {
    const routeInfo = routes[route];
    const type = routeInfo.type;
    const absPath = path.resolve(routeInfo.path);
    switch(type){
        case 'get': router.route(route).get(  require(absPath) ); break;
        case 'put': router.route(route).put(  require(absPath) ); break;
        case 'post':router.route(route).post( require(absPath) ); break;
        default: break;
    }
})


//router.route('/api/devices').get(require(path.resolve(__dirname,'controllers/api/devices.js')));

module.exports = router;