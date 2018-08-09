let DB_API = module.parent.exports;
let mainDB = DB_API.db.mainDB;

module.exports = async function getAll() {
    return new Promise(function(resolve, reject) {
      let cameras = 
      mainDB.all(`SELECT * FROM cameras`, async function(err, cameras) {
        if (err) {
          console.error(new Error(err))
          return reject(err);
        }
        for(let i = 0; i< cameras.length; i++){
          cameras[i].events = await getDeviceEvents(cameras[i]);
          cameras[i].zones = await getZones(cameras[i]);
        }
        resolve(cameras);
      })
    })
  };


async function getDeviceEvents(camera){
  return new Promise(function(resolve,reject){
    mainDB.all(`SELECT * FROM event_snapshots WHERE camera_id = ${camera.camera_id}`,(err,events) => {
      if (err) {
        console.error(new Error(err))
        return reject(err);
      }
      resolve(events)
    })
  })
}

async function getZones(camera){
  return new Promise(function(resolve,reject){
    mainDB.all(`SELECT * FROM zones WHERE camera_id = ${camera.camera_id}`,(err,zones) => {
      if (err) {
        console.error(new Error(err))
        return reject(err);
      }
      resolve(zones)
    })
  })
}