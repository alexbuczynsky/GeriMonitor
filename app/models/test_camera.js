const cameraClass = require('./camera.js');
const DB_API = require('../databases/db_api/db_api.js');
var moment = require('moment-timezone');
var push_events = require('../controllers/push_notifications/socketEvents').push_events;

DB_API.cameras.getAll()
.then(allCams => {
    return new Promise(function(resolve,reject){
        allCams.forEach(camInfo => {
            let testCam = new cameraClass({
                camera_id: camInfo.camera_id,
                name: camInfo.name,
                ip_address: camInfo.ip_address,
                port: camInfo.port,
                username: camInfo.username,
                password: camInfo.password,
            })
            resolve(testCam);
        })
    })
})
.then(camObj => { //each individual camera will come here one at a time
    console.log(camObj)
    
    //camObj.setPosition(0,0,0)
    //camObj.moveCamera('','Right',4,1000)
    // setInterval(() => {
    //     camObj.getVideoSnapshot()
    // },1000)
    
    
    // setInterval(() => {
    //     console.log(camObj.eventLog)
    // },5000)

    setInterval(()=> {
        camObj.syncTime();
    }, 1000*5)
    
    camObj._events.on("MotionDetected",function(){
        console.log(camObj.last_update,"motion was detected...")
        camObj.getLogs().then(allLogs => {
            console.log(allLogs)
            allLogs.forEach(log => {
                const t1 = moment(log.time,'YYYY-MM-DD HH:mm:ss');
                const t2 = moment(log.info.time,'YYYY-MM-DD HH:mm:ss');
                const diff = t1.diff(t2,'seconds');
                const tolerance= 3; //seconds
                console.log(`delta between t1 and t2`,diff)
                if(diff <= tolerance){
                    if(log.info.status){
                        console.log(`Motion Found in Zone called "${log.info.zone_name}" at ${log.info.time}`)
                        log.info.camera_id = camObj.camera_id;
                        DB_API.events.add(log.info).catch(err => console.log(err,log.info))
                        let notificationInfo = log.info;
                        notificationInfo.camera_name = camObj.name;
                        push_events.emit('motionDetected',notificationInfo)
                        
                    }
                }
            })
        })
        .catch(err => console.log(err));
        // const times = [200,500,1000];
        // times.forEach(time => {
        //     setTimeout(() => {
        //         camObj.getLogs().then(finished => {
        //             console.log(finished,time);
        //         });
        //     },time)
        // })
        
        
        //camObj.getVideoSnapshot("MotionEvent").then(imgData => console.log(imgData))
    })
    
    camObj._events.on("CameraConnected",function(){
        console.log(camObj.last_update,"Camera Connected",{name:camObj.name,host:camObj.ip_address,port:camObj.port})
    })
    
    //camObj.altTest()
    
    camObj.subscribeAlarms()
    
    // camObj.getMotionDetectionSettings().then(MotionDetectWindows => {
    //     // console.log(MotionDetectWindows)
    //     camObj.settings.motion.forEach(motion => {
    //         const zoneName = motion.Name;
    //         const zone_id = motion.Id;
    //         const Window = motion.Window;

    //         const options = {
    //             'zone_id' : zone_id,
    //             'camera_id': camObj.camera_id,
    //             'name' : zoneName,
    //             'x1' : Window[0],
    //             'y1' : Window[1],
    //             'x2' : Window[2],
    //             'y2' : Window[3],
    //             'threshold' : motion.Threshold,
    //             'sensitive' : motion.Sensitive,
    //         };

    //         DB_API.zones.add(options)
    //     })
    // })
})