const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const configuration = require('@feathersjs/configuration');
const rest = require('@feathersjs/express/rest');
const socketio = require('@feathersjs/socketio');

const handler = require('@feathersjs/express/errors');
const notFound = require('feathers-errors/not-found');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const authentication = require('./authentication');

const sequelize = require('./sequelize');
const neo4j   = require('./neo4j');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

app.configure(sequelize);
app.configure(neo4j);
app.configure(rest());
app.configure(socketio());

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Configure a middleware for 404s and the error handler
app.use(notFound());
// app.configure(handler({
//   // html: {
//   //   // strings should point to html files
//   //   404: 'path/to/custom-404.html',
//   //   default: 'path/to/generic/error-page.html'
//   // },
//   json: {
//     404: (err, req, res, next) => {
//       // make sure to strip off the stack trace in production
//       if (process.env.NODE_ENV === 'production') {
//         delete err.stack;
//       }
//       res.json({ message: 'Not found' });
//     },
//     default: (err, req, res, next) => {
//       // handle all other errors
//       res.json({ message: 'Oh no! Something went wrong' });
//     }
//   }
// }));

app.use(handler({
  json: {
    404: (err, req, res, next) => {
      // make sure to strip off the stack trace in production
      if (process.env.NODE_ENV === 'production') {
        delete err.stack;
      }
      res.json({ message: 'Not found' });
    },
    500: (err, req, res, next) => {
      console.log(err.toJSON())
      res.json({ message: 'service unavailable'})
    },
    default: (err, req, res, next) => {
      // handle all other errors
      res.json({ message: 'Oh no! Something went wrong' });
    }
  }
}));
app.hooks(appHooks);

module.exports = app;
