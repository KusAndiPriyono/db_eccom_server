const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv/config');
const authJwt = require('./middlewares/jwt');
const errorHandler = require('./middlewares/error_handler');

const app = express();
const env = process.env;
const API = env.API_URL;

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(cors());
app.options('*', cors());
app.use(authJwt());
app.use(errorHandler);

const authRouter = require('./routes/authRoutes');

app.use(`${API}/`, authRouter);
app.get(`${API}/users`, (req, res) => {
  return res.status(200).send('Ini adalah route users');
});

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
