var moment = require('moment-timezone');
const request = require('requestretry');

const position = require('./position');
var fs = require('fs');

var events = require('events');

const netList = require('network-list');




module.exports = class Camera {
    constructor(obj) {
        this.camera_id = obj.camera_id;
        this.name = obj.name;
        this.ip_address = obj.ip_address;
        this.username = obj.username;
        this.password = obj.password;
        this.port = obj.port || 80;
        this.position = new position();
        this.eventLog = [];
        this.mac_address = obj.mac_address;
        this.vendor_name = obj.vendor_name;
        this.settings = {
            'motion': null,
            'alarm': null,
            login: {
                session: null
            },
            EventHandler: {

            }
        }
        this._events = new events.EventEmitter();
        this._lastUpdate();
        this.syncTime();
    }

    async findIPAddress(){
        var cameraObj = this;
        return new Promise((resolve,reject) => {
            console.log("SCANNING FOR CAMERA...")
            netList.scanEach({}, (err, device) => {
                if(device.mac == cameraObj.mac_address) {
                    this.ip_address = device.ip;
                    console.log('FOUND CAMERA!!', device.hostname,device.ip, device.vendor,device.mac)
                    resolve(cameraObj);
                }
            });
        })
        
    }
    // `${this.username}:${this.password}@${this.ip_address}:${this.port}`
    reboot() {
        const url = `/magicBox.cgi?action=reboot`;
        this._standardRequest(url)
            .then(this.printURL)
            .catch(err => this.printError(Error(err)));
    }

    getMJPGstream() {
        var cameraObj = this;
        const url = `/mjpg/video.cgi`;
        const options = {
            url: this._serverURL() + url,
            'auth': this._auth()
        }
        let r = request.get(options, (error, answer, body) => {
            this._lastUpdate();
            console.error({
                error,
                body,
                options
            });
        })
        r.on('data', function (data) {
            //console.log(moment().format("hh:mm:ss"),this.host,this.port,this.response.statusCode,this.response.statusMessage)
            cameraObj._lastUpdate();
            const utf8String = data.toString('utf8');
            const infoArray = utf8String.split('\r\n');
            const eventInfo = infoArray.filter(x => x.includes('Code'));
            // if(utf8String.includes("Connection: Keep-Alive")){
            //     cameraObj._events.emit("CameraConnected");
            //     cameraObj.eventLog.push({
            //         time: moment().utc(),
            //         code: "CAMERA CONNECTED",
            //         action: null
            //     })
            // }
            //console.log(utf8String)

            // if(eventInfo.length > 0){
            //     const jsonStart = JSON.parse("{" + eventInfo[0].split(";").map(x => x.split('=').map(y => `"${y.replace('status.','')}"`).join(':')).join(',') + "}")
            //     //console.log(moment().format("hh:mm:ss"),jsonStart.Code,jsonStart.action)
            //     cameraObj.eventLog.push({
            //         time: moment().utc(),
            //         code: jsonStart.Code,
            //         action: jsonStart.action
            //     })
            //     if(jsonStart.Code == "VideoMotion" && jsonStart.action == "Start"){
            //         cameraObj._events.emit("MotionDetected");
            //     }
            // }          

        })
    }

    async getSession() {
        let camObj = this;
        const url = `http://${this.ip_address}:${this.port}/RPC2_Login`;
        return new Promise((resolve, reject) => {
            request.post({
                url: url,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: JSON.stringify({
                    "method": "global.login",
                    "params": {
                        "userName": "admin",
                        "password": "",
                        "clientType": "Web3.0",
                        "loginType": "Direct"
                    },
                    "id": 500
                })
            }, (error, answer, body) => {
                const params = JSON.parse(body).params;
                const session = JSON.parse(body).session;
                camObj.settings.login.session = 1885807568;
                console.log('getSession -------------------')
                console.log('params', params, session);
                this._lastUpdate();
                resolve(params);
            })
        });
    }

    async setEventHandlerConfig(params) {
        //param must be array
        const handlerName = 'MotionDetect[0].EventHandler';
        let url = `/configManager.cgi?action=setConfig`;
        params.forEach(param => {
            url+= `&${handlerName}.${param.name}=${param.value}`
        })
        
        let info = await this._standardRequest(url);
        return info;
    }

    async getEventHandlerConfig(params) {
        const handlerName = 'MotionDetect[0].EventHandler';
        let url = `/configManager.cgi?action=getConfig`;

        if(params.length !=0){
            params.forEach(param => {
                url+= `&name=${handlerName}.${param.name}`
            })
        }else{
            url+= `&name=${handlerName}`
        }
        
        
        let info = await this._standardRequest(url);
        return info;
    }

    async syncTime() {
        const url = `/global.cgi?action=getCurrentTime`;
        let info = await this._standardRequest_noPrint(url);
        const json = this._text2json(info.body);

        const cameraTime = moment(json.result, 'YYYY-MM-DD HH-mm-ss').unix()
        const deviceTime = moment().unix();
        const timeOffset = cameraTime - deviceTime;
        this.timeOffset = timeOffset;
    }

    timeConvert(timeString) {
        const inputDate = moment(timeString, 'YYYY-MM-DD HH-mm-ss');

    }

    getCameraTimeNow() {
        return moment().add(this.timeOffset, 'seconds');
    }
    async setTimeOffset() {
        const currentTime = moment().format('YYYY-MM-DD%20HH-mm-ss')
        const url = `/global.cgi?action=setCurrentTime&time=${currentTime}`;
        let info = await this._standardRequest(url);
        return info;
    }

    async getMotionDetectionSettings() {
        const url = `/configManager.cgi?action=getConfig&name=MotionDetect`;
        let info = await this._standardRequest_noPrint(url);
        const json = this._text2json(info.body);
        let camObj = this;
        const handlerName = 'table.MotionDetect[0]'
        const motionDetectWindowNames = [
            `${handlerName}.MotionDetectWindow[0]`,
            `${handlerName}.MotionDetectWindow[1]`,
            `${handlerName}.MotionDetectWindow[2]`,
            `${handlerName}.MotionDetectWindow[3]`
        ];
        let MotionDetectWindows = [{}, {}, {}, {}];
        motionDetectWindowNames.forEach((name, ii) => {
            const eventHandlerKeys = Object.keys(json).filter(x => x.includes('.EventHandler'));
            eventHandlerKeys.forEach(keyName => {
                const propName = keyName.split(`${handlerName}.EventHandler.`)[1];
                let propVal = json[keyName];
                camObj.settings.EventHandler[propName] = propVal;
            })
            const windowNames = Object.keys(json).filter(x => x.includes(name));
            windowNames.forEach(keyName => {
                const propName = keyName.split(name)[1].split('.')[1];
                let propVal = json[keyName];

                if (propName.includes('Region[')) {
                    const regionID = propName.split('[')[1].split(']')[0];
                    if (!('Region' in MotionDetectWindows[ii])) {
                        MotionDetectWindows[ii].Region = [];
                    }
                    MotionDetectWindows[ii].Region[Number(regionID)] = json[keyName];
                } else if (propName.includes('Window[')) {
                    const windowID = propName.split('[')[1].split(']')[0];
                    if (!('Window' in MotionDetectWindows[ii])) {
                        MotionDetectWindows[ii].Window = [];
                    }
                    MotionDetectWindows[ii].Window[Number(windowID)] = json[keyName];
                } else {
                    MotionDetectWindows[ii][propName] = json[keyName];
                }

                //console.log(MotionDetectWindows[ii][propName])
            })

        })
        this.settings.motion = MotionDetectWindows;
        return MotionDetectWindows;
    }

    moveCamera(verticalDirection, horizontalDirection, speed, duration) {
        const directions = [
            'Up',
            'RightUp',
            'Right',
            'RightDown',
            'Down',
            'LeftDown',
            'Left',
            'LeftUp'
        ];
        const direction = horizontalDirection + verticalDirection;
        var action = 'start';
        const ch = 1;
        const code = direction;
        const arg1 = 0;
        const arg2 = speed;
        const arg3 = 0;
        const url = `/ptz.cgi?action=${action}&channel=${ch}&code=${code}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}`
        this._standardRequest(url)
        setTimeout(() => {
            let action = 'stop';
            const url = `/ptz.cgi?action=${action}&channel=${ch}&code=${code}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}`
            this._standardRequest(url)
        }, duration)
    }

    moveCameraPulse(verticalDirection, horizontalDirection) {
        this.moveCamera(verticalDirection, horizontalDirection, 8, 100)
    }

    async getAlarmConfig() {
        const url = `/configManager.cgi?action=getConfig&name=Alarm`;
        let info = await this._standardRequest(url);
        const json = this._text2json(info.body);
        //console.log(json)
    }

    subscribeAlarms() {
        var cameraObj = this;
        const url = `/eventManager.cgi?action=attach&codes=[All]`;
        let r = request.get({
            url: this._serverURL() + url,
            'auth': this._auth(),
            forever:true
        }, (error, answer, body) => {
            this._lastUpdate();
            console.error({
                error,
                body
            });
        })
        r.on('data', function (data) {
            //console.log(moment().format("hh:mm:ss"),this.host,this.port,this.response.statusCode,this.response.statusMessage)
            cameraObj._lastUpdate();
            //console.log(this.response.rawHeaders)
            const utf8String = data.toString('utf8');
            const infoArray = utf8String.split('\r\n');
            const eventInfo = infoArray.filter(x => x.includes('Code'));
            if (utf8String.includes("Connection: Keep-Alive")) {
                cameraObj._events.emit("CameraConnected");
                cameraObj.eventLog.push({
                    time: moment().utc(),
                    code: "CAMERA CONNECTED",
                    action: null
                })
            }
            // console.log(utf8String)

            if (eventInfo.length > 0) {
                const jsonStart = JSON.parse("{" + eventInfo[0].split(";").map(x => x.split('=').map(y => `"${y.replace('status.','')}"`).join(':')).join(',') + "}")
                //console.log(moment().format("hh:mm:ss"),jsonStart.Code,jsonStart.action)
                cameraObj.eventLog.push({
                    time: moment().utc(),
                    code: jsonStart.Code,
                    action: jsonStart.action
                })
                if (jsonStart.Code == "VideoMotion" && jsonStart.action == "Start") {
                    cameraObj._events.emit("MotionDetected",utf8String);
                }
            }

        })
    }




    async clearAllLogs() {
        const url = `/log.cgi?action=clear`;
        let info = await this._standardRequest(url);
        return info;
    }

    async getLogs() {
        return new Promise((resolve, reject) => {
            let camera = this;
            const timeNow = camera.getCameraTimeNow().format('YYYY-MM-DD HH:mm:ss');

            const startTime = camera.getCameraTimeNow().subtract(60, 'seconds').format('YYYY-M-DD%20HH:mm:ss');
            const endTime = camera.getCameraTimeNow().add(1, 'minutes').format('YYYY-M-DD%20HH:mm:ss');
            // const url = `/recordFinder.cgi?action=find&name=AlarmRecord&StartTime=${startTime}&EndTime=${endTime}&count=500`;
            const url = `/log.cgi?action=startFind&condition.StartTime=${startTime}&condition.EndTime=${endTime}[& condition.Type=<type>]`

            this._standardRequest_noPrint(url)
                .then(response => {
                    const token = response.body.split('\r\n')[0].split('=')[1];
                    return token;
                })
                .then(async function (token) {
                    const response = await camera._getParticularNumberOfLogs(token);
                    const jsonLogs = camera._text2json(response.body);
                    const numLogs = jsonLogs.found;


                    let logEntries = Array.apply(null, Array(Number(numLogs)))
                    let motionEvents = [];
                    logEntries.forEach((entry, ii) => {
                        let event = Object.keys(jsonLogs)
                            .filter(key => key.includes(`items[${ii}]`))
                            .reduce((obj, key) => {
                                obj[key] = jsonLogs[key];
                                return obj;
                            }, {});
                        const prefix = `items[${ii}]`
                        const eventType = event[prefix + `.Detail.Event Type`];
                        const regionName = event[prefix + `.Detail.Region Name[0]`];
                        const time = event[prefix + `.Time`]
                        const status = event[prefix + `.Type`] === 'Event Begin';
                        if (eventType == 'Motion Detect') {
                            const options = {
                                'time': time,
                                'event_type': eventType,
                                'zone_name': regionName,
                                'status': status
                            };
                            motionEvents.push({
                                time: timeNow,
                                info: options
                            })
                        }

                        // console.log(eventType)
                    })
                    resolve(motionEvents)
                })
                .catch(err => this.printError(Error(err)));
        })
    }

    async _getParticularNumberOfLogs(token) {
        const url = `/log.cgi?action=doFind&token=${token}&count=100`;
        return this._standardRequest_noPrint(url)
    }

    getVideoSnapshot(fileName) {
        const camera = this;
        return new Promise((resolve, reject) => {
            const url = `/snapshot.cgi[?channel=1]`
            request.get({
                url: camera._serverURL() + url,
                'auth': camera._auth(),
                encoding: 'binary',
                maxAttempts: 5,   // (default) try 5 times
                retryDelay: 2000,  // (default) wait for 5s before trying again
            }, (error, answer, imgData) => {
                camera._lastUpdate();
                if(error){
                    return reject(error);
                }
                resolve(imgData);
            })
        })

    }

    resetPosition() {
        const action = 'start';
        const ch = 1;
        const code = 'Reset';
        const arg1 = 0;
        const arg2 = 1;
        const arg3 = 0;
        const arg4 = 0;
        const url = `/ptz.cgi?action=${action}&channel=${ch}&code=${code}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}&arg4=${arg4}`
        this._standardRequest(url)
            .then(this.printURL)
            .catch(err => this.printError(Error(err)));
    }

    setPosition(x, y, z) {
        const action = 'start';
        const ch = 1;
        const code = 'Position';
        const arg1 = x;
        const arg2 = y;
        const arg3 = z;
        const arg4 = 8;
        const url = `/ptz.cgi?action=${action}&channel=${ch}&code=${code}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}&arg4=${arg4}`
        this._standardRequest(url)
            .then(this.printURL)
            .catch(err => this.printError(Error(err)));
    }

    setABSPosition(horizontalAngle, verticalAngle, z) {
        const action = 'start';
        const ch = 1;
        const code = 'PositionABS';
        const arg1 = horizontalAngle;
        const arg2 = verticalAngle;
        const arg3 = z;
        const arg4 = 0;
        const url = `/ptz.cgi?action=${action}&channel=${ch}&code=${code}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}&arg4=${arg4}`
        this._standardRequest(url)
            .then(this.printURL)
            .catch(err => this.printError(Error(err)));
    }

    async getStatus() {
        const url = `/ptz.cgi?action=getStatus[&channel=1]`
        let info = await this._standardRequest(url);
        const json = this._text2json(info.body);
        this.position.setX(Number(json['Postion[0]']));
        this.position.setY(Number(json['Postion[1]']));
        this.position.setZ(Number(json['Postion[2]']));
        return await info;
    }

    shutdown() {
        const url = `/magicBox.cgi?action=shutdown`;
        this._standardRequest(url)
            .then(this.printURL)
            .catch(err => this.printError(Error(err)));
    }

    get authPassword() {
        return new Buffer(`${this.username}:${this.password}`).toString('base64')
    }

    login() {

    }

    printURL(info) {
        console.log(info)
    }

    printError(err) {
        console.error(err)
    }

    async _lastUpdate() {
        this.last_update = moment().utc().format();
        return true;
    }
    _serverURL() {
        return `http://${this.ip_address}:${this.port}/cgi-bin`;
    }

    _text2json(body) {
        return JSON.parse('{' + body.trim().split('\r\n').map(x => x.split('=').map(y => `"${y.replace('status.','')}"`).join(':')).join(',') + '}');;

    }

    _standardRequest(url) {
        console.log(this._serverURL() + url)
        return new Promise((resolve, reject) => {
            request.get({
                url: this._serverURL() + url,
                'auth': this._auth()
            }, (error, answer, body) => {
                this._lastUpdate();
                resolve({
                    error,
                    body
                });
            })
        });
    }

    _standardRequest_noPrint(url) {
        return new Promise((resolve, reject) => {
            request.get({
                url: this._serverURL() + url,
                'auth': this._auth()
            }, (error, answer, body) => {
                this._lastUpdate();
                resolve({
                    error,
                    body
                });
            })
        });
    }

    _auth() {
        return {
            'user': this.username,
            'pass': this.password,
            'sendImmediately': false
        };
    }
}