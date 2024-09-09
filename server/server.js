const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const twilio = require('twilio');
const axios = require('axios');
const app = express();
const { OAuth2Client } = require('google-auth-library');

require('dotenv').config();
const port = 9002;
const client1 = new OAuth2Client(process.env.AUTH_CLIENT);

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const session = require('express-session');

// Add this before your routes
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// MySQL connection
const db = mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "e-governance",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL connected...");
});

app.post("/generate-captcha", (req, res) => {
  const captcha = Math.random().toString(36).substring(2, 7); 
  req.session.captcha = captcha;
  res.json({ captcha }); 
});

// app.post("/api/register", async (req, res) => {
//   const {
//     first_name,
//     middle_name,
//     last_name,
//     email,
//     mobile_number,
//     govt_id_proof,
//     govt_id_number,
//     password,
//     captchaToken
//   } = req.body;

//   const secretKey = process.env.SECRET_KEY;
//   const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

//   try {
//     const captchaResponse = await axios.post(verifyUrl);

//     if (!captchaResponse.data.success) {
//       return res.status(400).json({ message: "Invalid CAPTCHA" });
//     }

//     db.query(
//       "SELECT email FROM users WHERE email = ?",
//       [email],
//       (err, result) => {
//         if (err) throw err;
//         if (result.length > 0) {
//           return res.status(400).json({ message: "Email already exists" });
//         }

//         // bcrypt.hash(password, 10, (err, hash) => {
//         //   if (err) throw err;

//         //   db.query(
//         //     "INSERT INTO users SET ?",
//         //     {
//         //       first_name,
//         //       middle_name,
//         //       last_name,
//         //       email,
//         //       mobile_number,
//         //       govt_id_proof,
//         //       govt_id_number,
//         //       password: hash,
//         //     },
//         //     (err, result) => {
//         //       if (err) throw err;
//         //       res.status(201).json({ message: "User registered successfully" });
//         //     }
//         //   );
//         // });
//         db.query(
//           "INSERT INTO users SET ?",
//           {
//             first_name,
//             middle_name,
//             last_name,
//             email,
//             mobile_number,
//             govt_id_proof,
//             govt_id_number,
//             password,  // Directly using the password without hashing
//           },
//           (err, result) => {
//             if (err) throw err;
//             res.status(201).json({ message: "User registered successfully" });
//           }
//         );
//       }
//     );
//   } catch (error) {
//     res.status(500).json({ message: "Error verifying CAPTCHA" });
//   }
// });

app.post("/api/register", async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    email,
    mobile_number,
    govt_id_proof,
    govt_id_number,
    password,
    captchaToken
  } = req.body;

  const secretKey = process.env.SECRET_KEY;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

  try {
    const captchaResponse = await axios.post(verifyUrl);

    if (!captchaResponse.data.success) {
      return res.status(400).json({ message: "Invalid CAPTCHA" });
    }

    // Check if the email already exists
    db.query(
      "SELECT email FROM users WHERE email = ?",
      [email],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length > 0) {
          return res.status(400).json({ message: "Email already exists" });
        }

        // Hash the password before saving
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) return res.status(500).json({ message: "Error hashing password" });

          // Insert the new user into the database
          db.query(
            "INSERT INTO users SET ?",
            {
              first_name,
              middle_name,
              last_name,
              email,
              mobile_number,
              govt_id_proof,
              govt_id_number,
              password: hash,  // Now correctly hashing the password
            },
            (err, result) => {
              if (err) return res.status(500).json({ message: "Error saving user" });
              res.status(201).json({ message: "User registered successfully" });
            }
          );
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error verifying CAPTCHA" });
  }
});

app.get('/api/users', (req, res) => {
    db.query('SELECT id, first_name, middle_name, last_name, email, mobile_number, govt_id_proof, govt_id_number, password, picture FROM users', (err, results) => {
        if (err) throw err;
        res.status(200).json(results);
    });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Query the database to find the user by email, username, or mobile number
  db.query(
    "SELECT * FROM users WHERE email = ? OR first_name = ? OR mobile_number = ?",
    [username, username, username],
    async (err, result) => {
      if (err) throw err;

      if (result.length > 0) {
        const user = result[0];

        // Compare the plain-text password with the hashed password in the DB
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
          // Send success response with user data (excluding the password)
          const { password, ...userData } = user;  // Exclude password
          res.status(200).json({ success: true, user: userData });
        } else {
          res.status(401).json({ success: false, message: "Invalid password" });
        }
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    }
  );
});


app.post('/api/check-user', (req, res) => {
  const { phoneNumber } = req.body;

  // Query to check if the user with the provided mobile number exists
  db.query(
      'SELECT * FROM users WHERE mobile_number = ?',
      [phoneNumber],
      (err, results) => {
          if (err) {
              console.error('Error querying database:', err);
              return res.status(500).json({ message: 'Error checking user existence' });
          }

          if (results.length > 0) {
              // User exists, return user details
              res.json({ exists: true, user: results[0] });
          } else {
              // User does not exist
              res.json({ exists: false });
          }
      }
  );
});

app.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    res.status(200).json({ message: 'OTP sent successfully.', sid: verification.sid });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP.', error });
  }
});

// Route to verify OTP
app.post('/verify-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phoneNumber, code: otp });

    if (verificationCheck.status === 'approved') {
      res.status(200).json({ message: 'OTP verified successfully.' });
    } else {
      res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP.', error });
  }
});


// Google login

// app.post('/google-login', async (req, res) => {
//   const { token } = req.body;
//   try {
//     console.log('Received token:', token);
//     const ticket = await client1.verifyIdToken({
//       idToken: token,
//       audience: '802852813018-k29a6gd2rd0e71na3umbjnjfdgiqorak.apps.googleusercontent.com'
//     });
//     const payload = ticket.getPayload();
//     console.log('Payload:', payload);
    
//     const user = {
//       id: payload.sub,
//       email: payload.email,
//       first_name: payload.given_name,
//       last_name: payload.family_name,
//       picture: payload.picture  
//     };

//     res.status(200).json({ user });
//   } catch (error) {
//     console.error('Error verifying Google token', error);
//     res.status(500).json({ error: 'Failed to authenticate token' });
//   }
// });

app.post('/google-login', async (req, res) => {
  const { token } = req.body;
  try {
    // console.log('Received token:', token);
    const ticket = await client1.verifyIdToken({
      idToken: token,
      audience: process.env.AUTH_CLIENT,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    // Check if the email exists in the database
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ error: 'Database query failed' });
      }

      if (result.length > 0) {
        // User exists, return the user data
        const existingUser = result[0];
        console.log('User already exists:', existingUser);
        return res.status(200).json({ user: existingUser });
      } else {
        // User does not exist, insert new user data
        const newUser = {
          first_name: given_name,
          last_name: family_name,
          email: email,
          picture: picture,
        };

        db.query('INSERT INTO users SET ?', newUser, (err, insertResult) => {
          if (err) {
            console.error('Error inserting new user:', err);
            return res.status(500).json({ error: 'Failed to insert new user' });
          }

          // Retrieve the newly inserted user's data to return
          db.query('SELECT * FROM users WHERE email = ?', [email], (err, insertedUserResult) => {
            if (err) {
              console.error('Error retrieving inserted user:', err);
              return res.status(500).json({ error: 'Failed to retrieve inserted user' });
            }

            const insertedUser = insertedUserResult[0];
            console.log('New user created:', insertedUser);
            return res.status(200).json({ user: insertedUser });
          });
        });
      }
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(500).json({ error: 'Failed to authenticate token' });
  }
});


const PORT = process.env.PORT || port;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
