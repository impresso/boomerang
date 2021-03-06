const { queryWithCommonParams } = require('../../hooks/params');

module.exports = {
  before: {
    all: [

    ],
    find: [
      queryWithCommonParams(),
    ],
    get: [
      queryWithCommonParams(),
    ],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
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
