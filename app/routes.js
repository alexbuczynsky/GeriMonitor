module.exports = function(app, passport) {
    var express = require('express');
    var router = express.Router();
    var moment = require('moment-timezone');

    // Initialze passport and restore authentication states
    app.use(passport.initialize());
    // Initialze passport and restore authentication states
    app.use(passport.session());
    // parse the body content from things such as the inputs of forms
    app.use(require('body-parser').json()) 

    //Logging Middleware
    router.use(function timeLog (req, res, next) {
        //console.log(req.body)
        next()
    })
    require(__dirname + '/controllers/security/user-auth.js')(passport); // pass in the passport authentication settings


    var path = require('path');

    const routes = {
        '/'                 : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/views/nurse_view.js' },
        '/admin'            : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/views/index.js' },
        '/events'           : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/views/events.js' },
        '/cameras'          : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/views/cameras.js' },
        '/zones'            : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/views/zones.js' },
        '/login'            : { type: 'GET' ,  securityLevel: -1,  path: 'app/controllers/views/login.js' },
        '/nurse_view'       : { type: 'GET' ,  securityLevel: -1,  path: 'app/controllers/views/nurse_view.js' }
    }
    
    const apiRoutes = {
        '/api/cameras'                                : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/API/cameras/allCameras.js' }, //get all cameras from cameras table
        '/api/snapshots/:file_name'                   : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/API/snapshots/snapshot_event.js' }, //get camera entry based on id
        // '/api/cameras/:camera_id/events'              : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/API/cameras/.js' }, //get all events for one camera
        // '/api/cameras/:camera_id/events/:id/'         : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/API/cameras/.js' }, //get specific information for that event
        // '/api/cameras/:camera_id/events/:id/snapshot' : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/API/cameras/.js' }, //get specific information for that event
        // '/api/cameras/:camera_id/events/'             : { type: 'GET' ,  securityLevel:  2,  path: 'app/controllers/API/cameras/.js' }, //get all events for one camera
    }

    router.route('/login').post(passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/login'
    }));
    router.route('/logout').get(function(req, res) {
        req.logout();
        res.redirect('/');
    });

    console.log('routes:\n',require('prettyjson').render(routes))

    Object.keys(apiRoutes).forEach(route => {
        const routeInfo = apiRoutes[route];
        const type = routeInfo.type;
        const absPath = path.resolve(routeInfo.path);
        const securityLevel = routeInfo.securityLevel;
        let middleWareFunction = function(req, res, next){next()};
        if(securityLevel >=0){ //this is for all non-public pages which require security
            middleWareFunction = require('connect-ensure-login').ensureLoggedIn();
        }
        switch(type){
            case 'GET': router.route(route).get(  middleWareFunction, require(absPath) ); break;
            case 'PUT': router.route(route).put(  middleWareFunction, require(absPath) ); break;
            case 'POST':router.route(route).post( middleWareFunction, require(absPath) ); break;
            default: break;
        }
    })


    Object.keys(routes).forEach(route => {
        const routeInfo = routes[route];
        const type = routeInfo.type;
        const absPath = path.resolve(routeInfo.path);
        const securityLevel = routeInfo.securityLevel;
        let middleWareFunction = function(req, res, next){next()};
        if(securityLevel >=0){ //this is for all non-public pages which require security
            middleWareFunction = require('connect-ensure-login').ensureLoggedIn();
        }
        switch(type){
            case 'GET': router.route(route).get(  middleWareFunction, require(absPath) ); break;
            case 'PUT': router.route(route).put(  middleWareFunction, require(absPath) ); break;
            case 'POST':router.route(route).post( middleWareFunction, require(absPath) ); break;
            default: break;
        }
    })
    return router;
}