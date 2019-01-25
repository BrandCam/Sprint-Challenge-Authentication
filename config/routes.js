// require("dotenv").config();

const axios = require("axios");
const db = require("../database/dbConfig");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const { authenticate } = require("../auth/authenticate");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

// TOKEN maker
function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const secret = jwtSecret;
  const options = {
    expiresIn: "1h"
  };
  return jwt.sign(payload, secret, options);
}

function register(req, res) {
  // implement user registration
  const creds = req.body;
  creds.password = bcrypt.hashSync(creds.password, 12);
  db("users")
    .insert(creds)
    .then(id => res.status(201).json(id))
    .catch(err => res.status(500).json(err));
}

function login(req, res) {
  // implement user login
  const creds = req.body;
  db("users")
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res.status(200).json(token);
      } else {
        res.status(401).json({ error: "login failed" });
      }
    })
    .catch(err => res.status(500).json({ message: "sad times", err }));
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}
