# CLASSES
## new camera(options)
Create a new camera object that connects to your amcrest camera. This class communicates via the http API exposed on the camera itself. The following is an example for the constructor.
```javascript 
const Camera = require('./camera.js');
const options = {
    camera_id: int,
    name:'string',
    ip_address: '192.168.0.0',
    username: '<your camera username>',
    password: '<your camera password>',
    port: 80 //the port where the api can be accessed (by default 80)
};
var testCam = new Camera(obj);
```
## Base Server URL
**BaseURL:** [http://${this.ip_address}:${this.port}]()
## Camera#reboot()
Reboots the camera.
## Camera#subscribeAlarms()
Opens a socket to the  camera and listens to any alarm emitted by the camera. These events are under Camera._events. The following is all the events that can be listened to:
- **MotionDetected**: When motion is detected in any of the four regions this event is triggered.
- **CameraConnected**: When the camera is connectd and streaming for the first time, the event is emitted.

Example subscribing to the events:
```javascript 
var Camera = require('./camera.js');
var testCam = new Camera({
    name: 'test',
    ip_address: '192.168.1.88',
    username: 'admin',
    password: 'xander216'
})

testCam._events.on("MotionDetected",function(){
    console.log(testCam.last_update,"motion was detected...")
})

testCam._events.on("CameraConnected",function(){
    console.log(
        testCam.last_update,"Camera Connected",
        {
            name:testCam.name,
            host:testCam.ip_address,
            port:testCam.port
        }
    )
})

testCam.subscribeAlarms()
```
## Camera#getVideoSnapshot(`<fileName>`)
Gets the latest snapshot and stores it by default under the snaps folder under models. The only passed paramater is the filename, which is appended by the timestamp in UTC. For example `MyFileName1532583451622.jpg`

## Camera#moveCamera(`vertical,horizontal,velocity,duration`)
```javascript
// Direction Options
const vertical = 'Up' || 'Down';
const horizontal = 'Left' || 'Right';
// Types of directions
const directionCombinations = [
    'Up',
    'RightUp',
    'Right',
    'RightDown',
    'Down',
    'LeftDown',
    'Left',
    'LeftUp'
];
```
## Camera#moveCameraPulse(`verticalDirection, horizontalDirection`)
```javascript
// Direction Options
const vertical = 'Up' || 'Down';
const horizontal = 'Left' || 'Right';
// Types of directions
const directionCombinations = [
    'Up',
    'RightUp',
    'Right',
    'RightDown',
    'Down',
    'LeftDown',
    'Left',
    'LeftUp'
];
```
Pulses the camera one step in the combination direction.



## Camera#syncTime()
**API URL:** `<BaseURL>/cgi-bin/global.cgi?action=getCurrentTime`<br>
**Class Function:** `.syncTime()`<br>
**Type:** ASYNC <br>
Gets the latest timestamp from the camera in UTC and compares it with the DateTime object on the device running the software. This difference is stored as `this.timeOffset` as an integer.

## Camera#setTimeOffset()
**API URL:** `<BaseURL>/cgi-bin/global.cgi?action=setCurrentTime&time=${currentTime}`<br>
**Class Function:** `.setTimeOffset()`<br>
**Type:** ASYNC <br>
Sets the camera date and time to the devices current timestamp. For now it is timezone dependent, but this is only because even though the AMCREST camera 'supports' timezones, it is only by name and no offsets are applied. The time is just a unix timecode with no real timezone integration.

## Camera#setEventHandlerConfig(`params <Array>`)
**API URL:** `<BaseURL>/cgi-bin/configManager.cgi?action=setConfig&${handlerName}.${params[0].name}=${params[0].value}&${handlerName}.${params[1].name}=${params[1].value}`<br>
**Class Function:** `.setEventHandlerConfig(params <Array>)`<br>
**Type:** ASYNC <br>
Each param has the following structure:
```javascript
const param = {
    name: "<paramatername>",  //example: "Dejitter"
    value: "<paramatervalue>" //example: 0
}
```
Sets the MotionDetect EventHandler Settings only for now. The function exclusively calls the handlerName `MotionDetect[0].EventHandler`.

## Camera#getEventHandlerConfig(`params <Array>`)
**API URL:** `<BaseURL>/cgi-bin/configManager.cgi?action=getConfig&${handlerName}.${params[0].name}&${handlerName}.${params[1].name}`<br>
**Class Function:** `.getEventHandlerConfig(params <Array>)`<br>
**Type:** ASYNC <br>
Each param has the following structure:
```javascript
const param = {
    name: "<paramatername>"  //example: "Dejitter"
}
```
Gets the MotionDetect EventHandler Settings only for now. The function exclusively calls the handlerName `MotionDetect[0].EventHandler`.