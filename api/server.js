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
app.use('/it4788', require('./routes/auth'));
app.use('/it4788/edit_post',require('./routes/edit_post'));
app.use('/it4788/add_post',require('./routes/add_post'));
app.use('/it4788/delete_post',require('./routes/delete_post'));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`))

