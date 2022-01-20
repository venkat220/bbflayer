//const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
//const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./app/utils/app.error');
const globalErrorHandler = require('./app/controllers/error.controller');
const authRouter = require('./app/routes/auth.route');
const pinRouter = require('./app/routes/pin.route');
const userRouter = require('./app/routes/user.route');

// Start express app
const app = express();
app.enable('trust proxy');

// Implement CORS
app.use(
  cors({
    origin: '*',
  })
);


app.options('*', cors());


// parse requests of content-type - application/json
app.use(bodyParser.json());


// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
//app.use('/', authRouter);
app.use('/api/v1/auth', authRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//app.use(globalErrorHandler);

module.exports = app;
