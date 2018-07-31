// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');
var sqlite3 = require('sqlite3').verbose();

const path = require('path');
const dbPath = path.resolve(__dirname, '../../databases/main.db')
var sqlite3 = require('sqlite3').verbose();
var userAuthDB = new sqlite3.Database(dbPath);
const salt = "to_be_randomized";
//Code being tested
function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

// expose this function to our app using module.exports
module.exports = function(passport) {

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'
  passport.use('local-login', new LocalStrategy({
    passReqToCallback: true
  }, function (req, username, password, cb) {
    userAuthDB.get('SELECT * FROM users WHERE user_name = ?', username, function (err, row) {
      if (!row)
        return cb(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

      let hash = hashPassword(password, row.salt);

      if (hash != row.password) {
        return cb(null, false, req.flash('loginMessage', 'Username / Password combination failed!')); // req.flash is the way to set flashdata using connect-flashreturn cb(null, false); // create the loginMessage and save it to session as flashdata
      } else {
        return cb(null, row); //the row in this context is the user info being passed back to cb funtion
      }
    });
  }));

  // used to serialize the user for the session
  passport.serializeUser(function(user, cb) {
    return cb(null, user.user_id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, cb) {
    userAuthDB.get('SELECT * FROM users WHERE user_id = ?', id, function(err, row) {
      if (!row) return cb(null, false);
      return cb(null, row);
    });
  });


  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'
  // process the signup form
  passport.use('local-signup', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, cb) {
      //console.log("hello-from-local-signup");
      if(req.body.password != req.body.password2)
        return cb(null, false, req.flash('loginMessage', 'Passwords do not match!')); // req.flash is the way to set flashdata using connect-flash
      userAuthDB.get('SELECT username, password FROM users WHERE username = ?', username, function(err, row) {
        if (err)
          return cb(err);
        // check to see if theres already a user with that email
        if (row) //if a username already found and exists
          return cb(null, false, req.flash('loginMessage', 'User already exists!')); // req.flash is the way to set flashdata using connect-flash

        // if the previous checks have passed, add user to database!
        //sql command to write form data into database
        /* included values for each row: (note that the id will be auto populated)
          [
            username
            password (hashed)
            salt
            role
            first_name
            last_name
            email
          ]
        */
        let newUserRowValues = [
          req.body.username,
          hashPassword(req.body.password,salt),
          salt,
          2,  //the user role is 2, which is the general user, no admin access is granted unles authorized later by higher level
          req.body.first_name,
          req.body.last_name,
          req.body.email
        ];
        //console.log(newUserRowValues.toString())
        userAuthDB.run(`INSERT INTO users(username,password,salt,role,first_name,last_name,email) VALUES(?,?,?,?,?,?,?)`, newUserRowValues, function(err) {
          if (err) {
            return err.message;
          }
          // get the last insert id
          //console.log(`A row has been inserted with rowid ${this.lastID}`);
          return cb(null, {
            id: this.lastID,
            username: req.body.username
          });
        });
      });
    }))
};
