const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv/config');
const authJwt = require('./middlewares/jwt');
const errorHandler = require('./middlewares/error_handler');
const authorizePostRequests = require('./middlewares/authorization');

const app = express();
const env = process.env;
const API = env.API_URL;

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(cors());
app.options('*', cors());
app.use(authJwt());
app.use(authorizePostRequests);
app.use(errorHandler);

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const productsRouter = require('./routes/productRoutes');

app.use(`${API}/`, authRouter);
app.use(`${API}/users`, userRouter);
app.use(`${API}/admin`, adminRouter);
app.use(`${API}/category`, categoryRouter);
app.use(`${API}/products`, productsRouter);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

const hostname = env.HOST;
const port = env.PORT;
require('./helpers/cron_job');

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
