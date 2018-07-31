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
        '/'                 : { type: 'get' ,  securityLevel:  2,  path: 'app/controllers/views/index.js' },
        '/events'           : { type: 'get' ,  securityLevel:  2,  path: 'app/controllers/views/events.js' },
        '/cameras'          : { type: 'get' ,  securityLevel:  2,  path: 'app/controllers/views/cameras.js' },
        '/login'            : { type: 'get' ,  securityLevel: -1,  path: 'app/controllers/views/login.js' }
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
            case 'get': router.route(route).get(  middleWareFunction, require(absPath) ); break;
            case 'put': router.route(route).put(  middleWareFunction, require(absPath) ); break;
            case 'post':router.route(route).post( middleWareFunction, require(absPath) ); break;
            default: break;
        }
    })
    return router;
}