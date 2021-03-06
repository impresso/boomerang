const auth = require('@feathersjs/authentication');

const { authenticate } = auth.hooks;
const { queryWithCurrentUser } = require('feathers-authentication-hooks');
const { assignIIIF } = require('../../hooks/iiif');
const {
  queryWithCommonParams, validate, REGEX_UID, utils, queryWithCurrentExecUser,
} = require('../../hooks/params');

const ORDER_BY = {
  date: 'buc.creation_time',
  latest: 'buc.last_modified_time',
  name: 'buc.name',
};

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
    ],
    find: [
      validate({
        q: {
          required: false,
          min_length: 2,
          max_length: 1000,
          transform: utils.toLucene,
        },
        order_by: {
          choices: ['-date', 'date', '-latest', 'latest', '-name', 'name'],
          transform: d => utils.toOrderBy(d, ORDER_BY),
        },
      }),
      // queryWithCurrentUser()
      // validate({
      //   // the bucket owner uid
      //   // owner_uid: {
      //   //   required: false,
      //   //   min_length: 3,
      //   //   regex: REGEX_UID
      //   // },
      // })
      queryWithCommonParams(),
      queryWithCurrentUser({
        idField: 'uid',
        as: 'user__uid',
      }),
    ],
    get: [
      queryWithCommonParams(),
      queryWithCurrentUser({
        idField: 'uid',
        as: 'user__uid',
      }),
    ],
    create: [
      validate({
        // request must contain a name - from which we will create a UID
        name: {
          required: true,
          min_length: 3,
          max_length: 50,
        },
        // the bucket owner uid, optional. Default to current authenticated user.
        owner_uid: {
          required: false,
          min_length: 3,
          regex: REGEX_UID,
        },
        // optionally
        description: {
          required: false,
          max_length: 500,
        },
        // used only if params.user.is_staff
        bucket_uid: {
          required: false,
          regex: REGEX_UID,
        },
      }, 'POST'),
      queryWithCurrentExecUser(),
    ],
    update: [],
    patch: [
      queryWithCurrentUser({
        idField: 'uid',
        as: 'user__uid',
      }),
      validate({
        // request must contain a name - from which we will create a UID
        name: {
          required: false,
          min_length: 3,
          max_length: 50,
        },
        description: {
          required: false,
          min_length: 3,
          max_length: 500,
        },
      }, 'POST'),
    ],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [
      assignIIIF('items'),
    ],
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
