const { validateWithSchema } = require('../../hooks/schema');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      validateWithSchema('services/entity-mentions-timeline/schema/create/payload.json'),
    ],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      validateWithSchema('services/entity-mentions-timeline/schema/create/response.json', 'result'),
    ],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
