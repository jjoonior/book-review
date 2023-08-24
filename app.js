const express = require('express')
require('dotenv').config();

const app = express();
const {PORT} = process.env;

app.use('/', require('./controller/review.controller'));

app.listen(PORT);
