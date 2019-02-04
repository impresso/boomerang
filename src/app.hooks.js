// Application hooks that run for every service
const logger = require('./hooks/logger');
const { validateRouteId } = require('./hooks/params');
const { authenticate } = require('@feathersjs/authentication').hooks;

const basicParams = () => (context) => {
  if(!context.params) {
    context.params = {};
  }
  if (!context.params.query) {
    context.params.query = {};
  }
};

const hooks = {
  before: {
    all: [
      validateRouteId(),
      authenticate('jwt'),
    ],
    find: [
      basicParams(),
    ],
    get: [
      basicParams(),
    ],
    create: [
      basicParams(),
    ],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [logger()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [logger()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};

module.exports = function (app) {
  const config = app.get('appHooks');

  // based on config
  if (config.alwaysRequired) {
    hooks.before.all.push(authenticate('jwt'));
  }
  // set hooks
  app.hooks(hooks);
};
