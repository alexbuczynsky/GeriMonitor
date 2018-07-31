var moment = require('moment-timezone');
var request = require('request');

const position = require('./position');
var fs = require('fs');

var events = require('events');




module.exports = class Camera {
    constructor(obj) {
        this.camera_id = obj.camera_id;
        this.name  = obj.name;
        this.ip_address = obj.ip_address;
        this.username = obj.username;
        this.password = obj.password;
        this.port = obj.port || 80;
        this.position = new position();
        this.eventLog = [];
        this.settings = {
            'motion':null,
            'alarm':null
        }
        this._events = new events.EventEmitter();
        this._lastUpdate();
        this.syncTime();
    }
    // `${this.username}:${this.password}@${this.ip_address}:${this.port}`
    reboot(){
        const url = `/magicBox.cgi?action=reboot`;
        this._standardRequest(url)
        .then(this.printURL)
        .catch(err => this.printError(Error(err)));
    }

    getMJPGstream(){
        var cameraObj = this;
        const url = `/mjpg/video.cgi`;
        const options = {
            url: this._serverURL()+url,
            'auth': this._auth()
        }
        let r = request.get(options, (error, answer, body) => {
            this._lastUpdate();
            console.error({error,body,options});
        })
        r.on('data', function(data){
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
            console.log(utf8String)
            
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
            
        } )
    }

    async syncTime(){
        const url = `/global.cgi?action=getCurrentTime`;
        let info = await this._standardRequest_noPrint(url);
        const json = this._text2json(info.body);        
        
        const cameraTime = moment(json.result,'YYYY-MM-DD HH-mm-ss').unix()
        const deviceTime = moment().unix();
        const timeOffset = cameraTime - deviceTime;
        //console.log(cameraTime,deviceTime,'timeOffset',timeOffset)
        this.timeOffset = timeOffset;
    }

    timeConvert(timeString){
        const inputDate = moment(timeString,'YYYY-MM-DD HH-mm-ss');

    }

    getCameraTimeNow(){
        return moment().add(this.timeOffset,'seconds');
    }
    async setTimeOffset(){
        const currentTime = moment().format('YYYY-MM-DD%20HH-mm-ss')
        const url = `/global.cgi?action=setCurrentTime&time=${currentTime}`;
        let info = await this._standardRequest(url);      
        console.log(info)
        return info;  
    }

    async getMotionDetectionSettings(){
        const url = `/configManager.cgi?action=getConfig&name=MotionDetect`;
        let info = await this._standardRequest(url);
        const json = this._text2json(info.body);
        const motionDetectWindowNames = [
            'table.MotionDetect[0].MotionDetectWindow[0]',
            'table.MotionDetect[0].MotionDetectWindow[1]',
            'table.MotionDetect[0].MotionDetectWindow[2]',
            'table.MotionDetect[0].MotionDetectWindow[3]'
        ];
        let MotionDetectWindows = [{},{},{},{}];
        motionDetectWindowNames.forEach((name,ii) => {
            const keys = Object.keys(json).filter(x => x.includes(name));
            keys.forEach(keyName => {
                const propName = keyName.split(name)[1].split('.')[1];
                let propVal = json[keyName];
                // console.log(keyName,propName)
                
                if(propName.includes('Region[')){
                    const regionID = propName.split('[')[1].split(']')[0];
                    if(!('Region' in MotionDetectWindows[ii])){
                        MotionDetectWindows[ii].Region = [];
                    }
                    MotionDetectWindows[ii].Region[Number(regionID)] = json[keyName];
                }else if(propName.includes('Window[')){
                    const windowID = propName.split('[')[1].split(']')[0];
                    if(!('Window' in MotionDetectWindows[ii])){
                        MotionDetectWindows[ii].Window = [];
                    }
                    MotionDetectWindows[ii].Window[Number(windowID)] = json[keyName];
                }else{
                    MotionDetectWindows[ii][propName] = json[keyName];
                }
                
                //console.log(MotionDetectWindows[ii][propName])
            })
            
        })
        this.settings.motion = MotionDetectWindows;
        return MotionDetectWindows;
    }

    moveCamera(verticalDirection,horizontalDirection,speed,duration){
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
        const direction = horizontalDirection+verticalDirection;
        var action = 'start';
        const ch = 1;
        const code = direction;
        const arg1 = 0;
        const arg2 = speed;
        const arg3 = 0;
        const url = `/ptz.cgi?action=${action}&channel=${ch}&code=${code}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}`
        this._standardRequest(url)
        setTimeout( () => {
            let action = 'stop';
            const url = `/ptz.cgi?action=${action}&channel=${ch}&code=${code}&arg1=${arg1}&arg2=${arg2}&arg3=${arg3}`
            this._standardRequest(url)
        },duration)
    }

    moveCameraPulse(verticalDirection,horizontalDirection){
        this.moveCamera(verticalDirection,horizontalDirection,8,100)
    }
    
    async getAlarmConfig(){
        const url = `/configManager.cgi?action=getConfig&name=Alarm`;
        let info = await this._standardRequest(url);
        const json = this._text2json(info.body);
        console.log(json)
    }

    subscribeAlarms(){
        var cameraObj = this;
        const url = `/eventManager.cgi?action=attach&codes=[AlarmLocal%2CVideoMotion%2CVideoLoss%2CVideoBlind]`;
        let r = request.get({
            url: this._serverURL()+url,
            'auth': this._auth()
        }, (error, answer, body) => {
            this._lastUpdate();
            console.error({error,body});
        })
        r.on('data', function(data){
            //console.log(moment().format("hh:mm:ss"),this.host,this.port,this.response.statusCode,this.response.statusMessage)
            cameraObj._lastUpdate();
            //console.log(this.response.rawHeaders)
            const utf8String = data.toString('utf8');
            const infoArray = utf8String.split('\r\n');
            const eventInfo = infoArray.filter(x => x.includes('Code'));
            if(utf8String.includes("Connection: Keep-Alive")){
                cameraObj._events.emit("CameraConnected");
                cameraObj.eventLog.push({
                    time: moment().utc(),
                    code: "CAMERA CONNECTED",
                    action: null
                })
            }
            // console.log(utf8String)
            
            if(eventInfo.length > 0){
                const jsonStart = JSON.parse("{" + eventInfo[0].split(";").map(x => x.split('=').map(y => `"${y.replace('status.','')}"`).join(':')).join(',') + "}")
                //console.log(moment().format("hh:mm:ss"),jsonStart.Code,jsonStart.action)
                cameraObj.eventLog.push({
                    time: moment().utc(),
                    code: jsonStart.Code,
                    action: jsonStart.action
                })
                if(jsonStart.Code == "VideoMotion" && jsonStart.action == "Start"){
                    cameraObj._events.emit("MotionDetected");
                }
            }          
            
        } )
    }

    async clearAllLogs(){
        const url = `/log.cgi?action=clear`;
        let info = await this._standardRequest(url);
        return info;
    }

    async getLogs(){
        return new Promise((resolve,reject) => {
            let camera = this;
            const timeNow = camera.getCameraTimeNow().format('YYYY-MM-DD HH:mm:ss');

            const startTime = camera.getCameraTimeNow().subtract(60, 'seconds').format('YYYY-M-DD%20HH:mm:ss');
            const endTime   = camera.getCameraTimeNow().add(1,'minutes').format('YYYY-M-DD%20HH:mm:ss');
            // const url = `/recordFinder.cgi?action=find&name=AlarmRecord&StartTime=${startTime}&EndTime=${endTime}&count=500`;
            const url = `/log.cgi?action=startFind&condition.StartTime=${startTime}&condition.EndTime=${endTime}[& condition.Type=<type>]`
            
            this._standardRequest_noPrint(url)
            .then(response => {
                const token = response.body.split('\r\n')[0].split('=')[1];
                return token;
            })
            .then(async function(token) {
                const response = await camera._getParticularNumberOfLogs(token);
                const jsonLogs = camera._text2json(response.body);
                const numLogs = jsonLogs.found;
                

                let logEntries = Array.apply(null, Array(Number(numLogs)))
                let motionEvents = [];
                logEntries.forEach((entry,ii) => {
                    let event = Object.keys(jsonLogs)
                                    .filter(key => key.includes(`items[${ii}]`))
                                    .reduce((obj, key) => {
                                        obj[key] = jsonLogs[key];
                                        return obj;
                                    }, {});
                    const prefix = `items[${ii}]`
                    const eventType = event[prefix+`.Detail.Event Type`];
                    const regionName = event[prefix+`.Detail.Region Name[0]`];
                    const time = event[prefix+`.Time`]
                    const status = event[prefix+`.Type`] === 'Event Begin';
                    if(eventType == 'Motion Detect'){
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

    async _getParticularNumberOfLogs(token){
        const url = `/log.cgi?action=doFind&token=${token}&count=100`;
        return this._standardRequest_noPrint(url)
    }

    getVideoSnapshot(fileName){
        const camera = this;
        return new Promise((resolve,reject) => {
            const url = `/snapshot.cgi[?channel=1]`
            request.get({
                url: camera._serverURL()+url,
                'auth': camera._auth(),
                encoding: 'binary'
            }, (error, answer, imgData) => {
                camera._lastUpdate();
                const timeStamp = moment().utc().format();
                resolve(imgData);
                //fs.writeFile(__dirname+'/snaps/'+`${fileName}_${timeStamp}.jpg`, imgData, 'binary', function (err) { err ? console.error(err) : console.log('image received',moment().format('hh:mm:ss:sss'))})
            })
        })
        
    }

    resetPosition(){
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

    setPosition(x,y,z){
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

    setABSPosition(horizontalAngle,verticalAngle,z){
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

    async getStatus(){
        const url = `/ptz.cgi?action=getStatus[&channel=1]`
        let info = await this._standardRequest(url);
        const json = this._text2json(info.body);
        this.position.setX(Number(json['Postion[0]']));
        this.position.setY(Number(json['Postion[1]']));
        this.position.setZ(Number(json['Postion[2]']));
        return await info;
    }

    shutdown(){
        const url = `/magicBox.cgi?action=shutdown`;
        this._standardRequest(url)
        .then(this.printURL)
        .catch(err => this.printError(Error(err)));
    }

    get authPassword(){
        return new Buffer(`${this.username}:${this.password}`).toString('base64')
    }

    login(){

    }

    printURL(info){
        console.log(info)
    }

    printError(err){
        console.error(err)
    }

    async _lastUpdate(){
        this.last_update = moment().utc().format();
        return true;
    }
    _serverURL(){
        return `http://${this.ip_address}:${this.port}/cgi-bin`;
    }

    _text2json(body){
        return JSON.parse('{' + body.trim().split('\r\n').map(x => x.split('=').map(y => `"${y.replace('status.','')}"`).join(':')).join(',')+'}');;
        
    }

    _standardRequest(url){
        console.log(this._serverURL()+url)
        return new Promise((resolve, reject) => {
            request.get({
                url: this._serverURL()+url,
                'auth': this._auth()
            }, (error, answer, body) => {
                this._lastUpdate();
                resolve({error,body});
            })
        });
    }

    _standardRequest_noPrint(url){
        return new Promise((resolve, reject) => {
            request.get({
                url: this._serverURL()+url,
                'auth': this._auth()
            }, (error, answer, body) => {
                this._lastUpdate();
                resolve({error,body});
            })
        });
    }

    _auth(){
        return {
            'user': this.username,
            'pass': this.password,
            'sendImmediately': false
        };
    }
}