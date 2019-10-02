const { protect } = require('@feathersjs/authentication-local').hooks;
const { authenticate } = require('../../hooks/authenticate');
const {
  validate, validateEach, queryWithCommonParams, displayQueryParams, REGEX_UID, utils,
} = require('../../hooks/params');
const {
  filtersToSolrQuery, qToSolrFilter,
  SOLR_FACETS, SOLR_GROUP_BY,
} = require('../../hooks/search');
const { resolveQueryComponents, filtersToSolrFacetQuery } = require('../../hooks/search-info');
const { paramsValidator, eachFilterValidator, eachFacetFilterValidator } = require('./search.validators');


module.exports = {
  before: {
    all: [],
    find: [
      authenticate('jwt', {
        allowUnauthenticated: true,
      }),
      validate({
        ...paramsValidator,
        facets: utils.facets({
          values: SOLR_FACETS,
        }),
      }),

      validateEach('filters', eachFilterValidator, {
        required: false,
      }),

      // TODO: Deprecated
      validateEach('facet-filters', eachFacetFilterValidator, {
        required: false,
      }),

      filtersToSolrFacetQuery(),

      qToSolrFilter('string'),
      filtersToSolrQuery(),
      queryWithCommonParams(),
    ],
    get: [],
    create: [
      authenticate('jwt'),
      validate({
        collection_uid: {
          required: true,
          regex: REGEX_UID,
        },
        group_by: {
          required: true,
          choices: ['articles'],
          transform: d => utils.translate(d, SOLR_GROUP_BY),
        },
      }, 'GET'),
      validateEach('filters', eachFilterValidator, {
        required: true,
        method: 'GET',
      }),
      qToSolrFilter('string'),
      filtersToSolrQuery(),
    ],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [
      displayQueryParams(['queryComponents', 'filters']),
      resolveQueryComponents(),
      protect('content'),
    ],
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
