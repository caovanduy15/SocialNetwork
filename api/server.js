const express = require('express')
const mongoose = require('mongoose')
const path = require('path')

const app = express()
const config = require("config")

// use express.json as middleware
app.use(express.json())

// connect to MongoDB
const url = config.get("mongoURI");
mongoose.connect(url,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(`errors: ${err}`)
);

// use Routes
app.use('/it4788/auth', require('./routes/auth'));
app.use('/it4788/post',require('./routes/posts'));
app.use('/it4788/comment',require('./routes/comments'));
app.use('/it4788/like',require('./routes/likes'));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`))