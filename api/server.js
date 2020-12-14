require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors');

const app = express()

// use express.json as middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// connect to MongoDB
const url = process.env.mongoURI;
mongoose.connect(url,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(`errors: ${err}`)
    );

// use Routes
app.use('/it4788', require('./routes/auth'));
app.use('/it4788', require('./routes/friend'));
app.use('/it4788', require('./routes/posts'));
app.use('/it4788', require('./routes/search'));
app.use('/it4788', require('./routes/comments'));
app.use('/it4788', require('./routes/likes'));
app.use('/it4788', require('./routes/friend'));
app.use('/it4788', require('./routes/settings'));
app.use('/it4788', require('./routes/user'));
app.use('/it4788', require('./routes/chat'));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`))
