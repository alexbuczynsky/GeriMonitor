var DB_API = require(process.cwd()+'/app/databases/db_api/db_api.js');
var fs = require('fs');
var path = require('path');
module.exports = async function(req, res) {
    const full_file_name = req.params.file_name;
    
    try{
        fs.readFile(process.cwd()+'/app/models/snaps/'+full_file_name, function (err,data) {
            if(err) throw err; // Fail if the file can't be read.
            res.writeHead(200,{'Content-type':'image/jpg'});
            //res.write(new Buffer(data, 'binary').toString('base64'));
            res.end(data);
        })
    }catch(err){
        console.log(err)
        res.status(500).end(err)
    }
}