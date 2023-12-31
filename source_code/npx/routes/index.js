var express = require('express');
var router = express.Router();
const multer = require("multer");
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();
const axios = require('axios')

//Backend routes (endpoints)
const host = process.env.BASE_URL
router.use(express.static(path.join(__dirname, '../public')));

// Get the date
function getDate()
{
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  return mm + '/' + dd + '/' + yyyy;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



var mongoose = require('mongoose');
const uri = process.env.MONGO_URI //atlas
var content_db
//const uri = 'mongodb://mongo:27017' //local (docker service)

async function connect(){
  try {
    await mongoose.connect(uri)
    content_db = mongoose.connection.collection('content');
    console.log("Connected to mongoDB")
    

  }
  catch(error){
    console.log(error)
  }
}


connect();

// Set up DB!
// User schema for DB
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  refresh_token: String,
  admin: Boolean
});
// Compile schema to a Model
const User = mongoose.model('User', userSchema);

//API endpoints

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: './uploads',
  filename: function (req, file, cb) {
    const fileName = 'temp.bin'; // Set a fixed file name (to overwrite binaries)
    cb(null, fileName);
  }
});

// Image reception handling
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
  },
});

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public');
  },
  filename: (req, file, cb) => {
    cb(null, 'resume_temp.pdf'); 
  },
});

const uploadResume = multer({ storage: resumeStorage });

const multerFilter = (req, file, cb) => {
  if (file.mimetype.split("/")[1] === "png" || file.mimetype.split("/")[1] === "jpg" || file.mimetype.split("/")[1] === "jpeg") {
    cb(null, true);
  } else {
    cb(new Error("Please upload an image"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const binaryupload = multer({
  storage: storage
});

// NODE MAILER
// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
});

// Unlink a user's spotify and musicbox account
router.post('/unlink', async(req,res) => {
  const id = req.body.id
  const user = await User.findOne({'_id': id});
  if (user)
  {
    user.refresh_token = ""
    await user.save()
    res.send("Unlinked!")

  }
  else
  {
    //404 user not found
    res.status(404).send("User not found")
  }
})

// Get whether or not a user has linked their spotify given uid
router.post('/isLinked', async(req, res) => {
  const id = req.body.id
  const user = await User.findOne({'_id': id});
  if (user)
  {
    res.send(user.refresh_token? true : false)

  }
  else
  {
    //404 user not found
    res.status(404).send("User not found")
  }
})

// From ESP, get the refresh token from DB 
router.post('/authorize_musicbox', async(req,res) => {
  const username = req.body.username;
  const pass = req.body.pass

  // bcrypt compare
  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (user) {
      // Compare the provided password with the stored hashed password
      bcrypt.compare(pass, user.password).then((resl) => {
        if (resl) {
          // Insure the authenticated user has linked their spotify
          if (user.refresh_token)
          {
            // Passwords match, return the refresh_token
            res.send(user.refresh_token)
          }
          else
          {
            // User has not yet linked spotify
            res.status(202).send("User has not linked Spotify!")
          }
          
        } else {
          // Passwords don't match
          res.status(401).send("Unauthorized")
        }

      })

      
    } else {
      // User not found
      res.status(404).send("User not found")
    }
  } catch (error) {
    console.log(error)
    res.status(500).send("500 Server error")
  }
})

// Login with spotify
router.get('/auth-callback', async(req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!state)
  {
    res.status(400).send("Bad Request")
  }
  const split = state.indexOf('uid')

  const redir = state.substring(0, split)
  const uid = state.substring(split + 3, state.length)
  
    if (code && state) {
      const response = await axios.post('https://accounts.spotify.com/api/token', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: process.env.SPOTIFY_CLIENT,
          redirect_uri: `${host}/auth-callback`
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: process.env.SPOTIFY_CLIENT,
          password: process.env.SPOTIFY_SECRET, // Replace with your actual client secret
        },
      });
      // We don't need to store the access token, because it only lasts an hour
      const refreshToken = response.data.refresh_token;
      User.findOneAndUpdate({'_id': uid}, {'refresh_token': refreshToken})
      .then((user) => {
        console.log (user)
      })

      res.redirect(redir+"?state=success")

      // Store the access token (e.g., in state or a context)
      // Redirect or perform other actions as needed
    } else {
      res.redirect(redir+"?state=fail")
    }
      
})

// Download resume
router.get('/download/resume', (req, res) => {
  const filePath = path.join(__dirname, '../public/resume_peter_buonaiuto.pdf');
  res.download(filePath);
});

// Find project by url
router.get('/findProject/:id', (req, res) => {

  Project.findOne({ searchtitle: { $regex: new RegExp(req.params.id.toLowerCase(), 'i') } })
  .then((foundDocument) => {
    res.json(foundDocument)
  })
  .catch((error) => {
    console.error(error);
  });

})

// Get data to display on webpage
router.get('/getMotd', (req, res) => {

  // Query the database to find relevant items
  content_db.find({}).toArray()
  .then(data => {
    res.status(200)
    res.json(data[0]['motd'])
  })
  .catch(error => {
    console.error(error);
    
    res.status(500)
    res.json("Error loading content")
  });


})


// Read the current version
router.get('/version', (req,res) => {
  const version_str = fs.readFileSync('version.txt', 'utf-8');
  res.send(version_str)
  
})

// Generate OTP when page is accessed
router.post('/sendOTP', (req, res) => {
  const id = req.body.id
  if (id == process.env.SECRET)
  {
    // Generate 2fa code and send to me
  const code = generateRandomPassword(50)
  fs.writeFileSync('2fa.txt', code)

  // Email
  const mailOptions = {
      from: process.env.MAILER_USER,
      to: process.env.MAILER_DEST,
      subject: 'MUSICBOX Binary Upload',
      text: `Code: ${code}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
      console.log('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send the email' });
      } else {
      res.status(200).json({ message: 'Email sent successfully' });
      }
  });

  res.status(200).send("Success");

  }
  else{
    // Unauthorized
    res.status(401).send("Unauthorized")
  }
      
  
  
});

// Check if the current user is an admin
router.post('/authAdmin', (req, res) => {
  const id = req.body.id
  if (id == process.env.SECRET)
  {
  res.status(200).send("Authenticated");

  }
  else{
    // Unauthorized
    res.status(401).send("Unauthorized")
  }
      
  
  
});

function generateRandomPassword(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}



// Handle file upload with password
router.post('/upload', binaryupload.single('file'), (req, res) => {
  const {file, msg, otp, id, status } = req.body;
  const OTP_stored = fs.readFileSync('2fa.txt', 'utf-8');
  
  fs.unlink('2fa.txt', (err)=> {});
  
    // check 2fa and user id
    if (id == process.env.SECRET && OTP_stored == otp)
    {
      success = true;
      response = "Error occured";
      

      // If we provided a new file upload it
      if (file != 'undefined')
      {
        // Accept the temp file
        fs.rename('uploads/temp.bin', 'uploads/musicbox.bin', (err)=> {})

        // Increase the version
        const version_str = fs.readFileSync('version.txt', 'utf-8');
        let version = +version_str
        fs.writeFileSync('version.txt', ++version + '') // Increase the version and write it to file

      }

      // Delete status if cleared
      if (status == "false")
      {
        content_db.updateOne({}, { $set: { motd: "" } })
      }

      // If we provided a new motd change it
      if (msg)
      {
        content_db.updateOne({}, { $set: { motd: msg } })
        .then((res) => {
          
        })
        .catch((e) => {
          success = false;
          response = e;
        })
      }

      if(success)
      {
        response = ""
        if (file != 'undefined')
        {
          response += 'Successfully uploaded version '+ version
        }

        if (msg)
        {
          response += 'Successfully set motd to '+msg
        }
        

        // Send success message
        res.status(200).send(response);

      }
      else{
        res.status(500).send(response)
      }

      
      
    }

    else {
    // credentials incorrect, reject the file
    fs.unlink('uploads/temp.bin', (err)=> {});
    res.status(401).send('Unauthorized');
  }
});

// Serve files
router.use('/uploads', express.static('uploads'));

// Route to handle email sending
router.post('/send-email', (req, res) => {
  const { name, email, message } = req.body;

  // Email message options
  const mailOptions = {
    from: process.env.MAILER_USER,
    to: process.env.MAILER_DEST,
    subject: 'New Message from Contact Form',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send the email' });
    } else {
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Email sent successfully' });
    }
  });
});

router.post('/login', login);

function login(req, res)
{
  User.find({'username': req.body.username})
  .then(function(value) {
    if (value.length === 1)
    {
      bcrypt.compare(req.body.password, value[0].password, (err, result) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          res.status(500)
          res.json({'authenticated': false})
        } else if (result) {
          res.json({'authenticated': true, 'username': value[0].username, 'admin': value[0].admin, 'id': value[0]._id})
        } else {
          res.status(401)
          res.json({'authenticated': false})
        }
      });
      
    }
    else
    {
    res.json({'authenticated': false})
  }
    
    
  }) 
  
}

router.post('/signup', signup);

function signup(req, res)
{
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      res.status(500)
      res.json("Could not hash password")
    } else {

      const newUser = new User({'username': req.body.username, 'password': hashedPassword, 'admin': false})
      newUser.save().then(function(value) 
      {
        // THIS IS THE RESPONSE THE CLIENT WILL GET!
        res.json({username: value.username, id: value._id}) 
      })
      
    }
  });
  
}

router.post('/update-account', updateAccount);

// Update this account username and password
function updateAccount(req, res)
{
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      res.status(500)
      res.json("Could not hash password")
    }
    else
    {

      User.findOneAndUpdate({'username': req.body.oldUsername}, {'username': req.body.username, 'password': hashedPassword})
      .then(function(value) 
      {
        // THIS IS THE RESPONSE THE CLIENT WILL GET!
        res.json({ id: value?._id}) 
      })

    }})
  
}


// given id get name
router.post('/get-name', getName)
async function getName(req, res)
{
  await User.findById(req.body.id)
  .then(function(value) {
    res.json({'username': value?.username})
  })
  .catch((result) => {
    // No id provided, usually when a user is logged out!
    res.json({'username': "ANONYMOUS"})
  })
}

router.post('/getUser', getUser)
function getUser(req, res)
{
  User.find({'username': req.body.username})
  .then(function(value) {
    let exists = (value.length === 1)
    res.json({'exists': exists})
  }) 
}



module.exports = router;
