const { authenticate } = require('@feathersjs/authentication').hooks;
const {
  queryWithCommonParams, validate, utils,
} = require('../../hooks/params');
const { STATUS_PRIVATE, STATUS_PUBLIC } = require('../../models/collections.model');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),

    ],
    find: [
      validate({
        q: {
          required: false,
          max_length: 500,
          transform: d => utils.toSequelizeLike(d),
        },
        order_by: {
          choices: ['-date', 'date', '-size', 'size'],
          defaultValue: '-date',
          transform: d => utils.toOrderBy(d, {
            date: 'date_last_modified',
            size: 'count_items',
          }).split(/[,\s]+/),
        },
      }),
      queryWithCommonParams(),
    ],
    get: [],
    create: [
      validate({
        // request must contain a name - from which we will create a UID
        name: {
          required: true,
          min_length: 3,
          max_length: 50,
        },
        // optionally
        description: {
          required: false,
          max_length: 500,
        },
        // optionally
        status: {
          required: false,
          choices: [STATUS_PRIVATE, STATUS_PUBLIC],
          defaultValue: STATUS_PRIVATE,
        },
      }, 'POST'),
    ],
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