const cameraClass = require('./camera.js');
const DB_API = require('../databases/db_api/db_api.js');
var moment = require('moment-timezone');
var push_events = require('../controllers/push_notifications/socketEvents').push_events;
var fs = require('fs');

exports.cameras = [];
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
                mac_address: camInfo.mac_address,
                vendor_name: camInfo.vendor_name
            })
            testCam.findIPAddress().then(() => {
                resolve(testCam);
            })
        })
    })
})
.then(camObj => { //each individual camera will come here one at a time
    console.log(camObj)
    exports.cameras.push(camObj)
    
    //camObj.setPosition(0,0,0)
    //camObj.moveCamera('','Right',4,1000)
    // setInterval(() => {
    //     camObj.getVideoSnapshot()
    // },1000)
    
    
    // setInterval(() => {
    //     console.log(camObj.eventLog)
    // },5000)


    /*
        Zone Blocks Definition:
        7818
        _______________ 7818,7735
        |             |
        |             |
        |             |
        |             |
        _______________ 7818, 0


        block:

        _____ (7818-7446, 7735-7280)
        |   |
        _____

        dx: 372
        dy: 455

    */
   camObj.getSession().then(info => {
       console.log(info)
   })

    setInterval(()=> {
        camObj.syncTime();
    }, 1000*5)

    camObj.getMotionDetectionSettings().then(MotionDetectWindows => {
        camObj.settings.motion.forEach(zone => {
            const zoneOptions = {
                zone_id: zone.Id,
                camera_id: camObj.camera_id,
                name: zone.Name,
                x1: zone.Window[0],
                y1: zone.Window[1],
                x2: zone.Window[2],
                y2: zone.Window[3],
                threshold: zone.Threshold,
                sensitive: zone.Sensitive
            };
            DB_API.zones.add(zoneOptions)
        })
    })
    
    camObj._events.on("MotionDetected",function(rawString){
        /*
        The Goals for what happens when motion is detected:
        - Log to the console the motion and where it occurred.
        - Save to the events as an entry
        - Save a snapshot and add it to the snapshot database
        */
        console.log("motionDetected",rawString);
        //console.log(camObj.last_update,"motion was detected...")
        camObj.getLogs().then(allLogs => {
            console.log('\n------- LOG EVENTS -------')
            allLogs.forEach((log,ii) => {
                console.log(`-- ${ii} time: ${log.info.time}\tzone: ${log.info.zone_name}\tstatus: ${log.info.status}`)
            })
            console.log('--------------------------\n')
            allLogs.forEach(log => {
                const t1 = moment(log.time,'YYYY-MM-DD HH:mm:ss');
                const t2 = moment(log.info.time,'YYYY-MM-DD HH:mm:ss');
                const diff = t1.diff(t2,'seconds');
                const tolerance= 3; //seconds
                // console.log(`delta between t1 and t2`,diff) //removing for non-verbose logging (dev mode should enable this)
                if(diff <= tolerance){
                    if(log.info.status){
                        console.log(`Motion Found in Zone called "${log.info.zone_name}" at ${log.info.time}`)
                        log.info.camera_id = camObj.camera_id;
                        DB_API.events.add(log.info).then(eventInfo => {
                            const event_id = eventInfo.event_id;
                            const timeStamp = t1;


                            push_events.emit(`motion ${log.info.zone_name}`);
                            

                            camObj.getVideoSnapshot().then(imgData => {
                                DB_API.snapshots.add({
                                    camera_id : camObj.camera_id,
                                    event_id : event_id,
                                    time : timeStamp.format("YYYYMMDD-HHmmss")
                                }).then(snapshot_info => {
                                    const fileName = snapshot_info.snapshot_file_name;
                                    const extension = snapshot_info.snapshot_file_extension;
                                    fs.writeFile(__dirname+'/snaps/'+`${fileName}.${extension}`, imgData, 'binary', function (err) { err ? console.error(err) : console.log('image received',moment().format('hh:mm:ss:sss'))})
                                })
                            })
                            .catch(err => {
                                console.log(err)
                            })
                        })
                        .catch(err => console.log(err,log.info))

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