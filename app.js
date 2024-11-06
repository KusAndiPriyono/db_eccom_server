const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv/config');

const app = express();
const env = process.env;
const API = env.API_URL;

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(cors());
app.options('*', cors());

const authRouter = require('./routes/authRoutes');

app.use(`${API}/`, authRouter);

const hostname = env.HOST;
const port = env.PORT;

mongoose
  .connect(env.MONGODB_CONNECTION_STRING)
  .then(() => {
    console.log('Terhubung ke database');
  })
  .catch((error) => {
    console.log('Gagal terhubung ke database');
    console.log(error);
  });

app.listen(port, hostname, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
