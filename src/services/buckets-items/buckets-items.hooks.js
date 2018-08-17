const { authenticate } = require('@feathersjs/authentication').hooks;
const {
  validate, validateEach, REGEX_UID, queryWithCommonParams,
} = require('../../hooks/params');
const { queryWithCurrentUser } = require('feathers-authentication-hooks');


module.exports = {
  before: {
    all: [
      authenticate('jwt'),
    ],
    find: [
      queryWithCommonParams(),
    ],
    get: [],
    create: [
      validate({
        bucket_uid: {
          required: true,
          regex: REGEX_UID,
        },
      }, 'POST'),
      validateEach('items', {
        label: {
          choices: ['article', 'entity', 'page', 'issue'],
          required: true,
        },
        uid: {
          regex: REGEX_UID,
          required: true,
        },
      }, {
        required: true,
        method: 'POST',
      }),
      queryWithCommonParams(),
    ],
    update: [],
    patch: [],
    remove: [
      validateEach('items', {
        label: {
          choices: ['article', 'entity', 'page', 'issue'],
          required: true,
        },
        uid: {
          regex: REGEX_UID,
          required: true,
        },
      }, {
        required: true,
        method: 'GET',
      }),
      queryWithCommonParams(),
    ],
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
