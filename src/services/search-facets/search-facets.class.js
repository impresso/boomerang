// @ts-check
const lodash = require('lodash');
const { NotFound, NotImplemented, BadRequest } = require('@feathersjs/errors');
const debug = require('debug')('impresso/services:search-facets');
const SearchFacet = require('../../models/search-facets.model');
const { SolrMappings } = require('../../data/constants');
const { measureTime } = require('../../util/instruments');
const { areCacheableFacets, isCacheableQuery } = require('../../util/cache');

const getFacetTypes = (typeString, index) => {
  const validTypes = Object.keys(SolrMappings[index].facets);
  const types = typeString.split(',');

  types.forEach((type) => {
    if (!validTypes.includes(type)) {
      throw new BadRequest(`Unknown facet type in index ${index}: ${type}`);
    }
  });

  if (!types.length) {
    throw new NotFound();
  } else if (types.length > 2) {
    // limit number of facets per requests.
    throw new NotImplemented();
  }
  return types;
};

const getRangeFacetMetadata = (facet) => {
  if (facet.type !== 'range') return {};
  return {
    min: facet.start,
    max: facet.end,
  };
};

class Service {
  constructor({
    app,
    name,
  }) {
    this.app = app;
    this.name = name;

    /** @type {import('../../cachedSolr').CachedSolrClient} */
    this.solr = app.get('cachedSolr');
  }

  async get(type, params) {
    const { index } = params.query;
    const types = getFacetTypes(type, index);

    // init with limit and skip
    const facetsq = {
      offset: params.query.skip,
      limit: params.query.limit,
      sort: params.query.order_by,
    };

    const canBeCached = areCacheableFacets(types) && isCacheableQuery(params.sanitized.filters);

    debug(`GET facets query for type "${type}" (${canBeCached ? 'cached' : 'not cached'}):`, facetsq);
    // facets is an Object, will be stringified for the solr query.
    // eslint-disable-next-line max-len
    // '{"newspaper":{"type":"terms","field":"meta_journal_s","mincount":1,"limit":20,"numBuckets":true}}'
    const facets = lodash(types)
      .map((d) => {
        const facet = {
          k: d,
          ...SolrMappings[index].facets[d],
          ...facetsq,
        };
        if (type === 'collection') {
          facet.prefix = params.authenticated ? params.user.uid : '-';
        }
        return facet;
      })
      .keyBy('k')
      .mapValues(v => lodash.omit(v, 'k'))
      .value();

    const query = {
      q: params.sanitized.sq,
      'json.facet': JSON.stringify(facets),
      start: 0,
      rows: 0,
      hl: false,
      vars: params.sanitized.sv,
    };

    const result = await measureTime(
      () => this.solr.get(query, index, { skipCache: !canBeCached }),
      'search-facets.get.solr.facets',
    );

    return types.map(t => new SearchFacet({
      type: t,
      ...result.facets[t],
      ...getRangeFacetMetadata(SolrMappings[index].facets[t]),
    }));
  }

  async find(params) {
    debug(`find '${this.name}': query:`, params.sanitized, params.sanitized.sv);

    // TODO: we may want to skip caching if facets requested contain 'collection'
    // However I (RK) could not find where this endpoint is used to understand what `facets` is.
    const canBeCached = isCacheableQuery(params.sanitized.filters);

    // TODO: transform params.query.filters to match solr syntax
    const result = await await measureTime(() => this.app.get('solrClient').findAll({
      q: params.sanitized.sq,
      // fq: params.sanitized.sfq,
      facets: params.query.facets,
      limit: 0,
      skip: 0,
      fl: 'id',
      vars: params.sanitized.sv,
    }, { skipCache: !canBeCached }), 'search-facets.find.solr.facets');

    const total = result.response.numFound;

    debug(`find '${this.name}': SOLR found ${total} using SOLR params:`, result.responseHeader.params);
    return {
      data: Object.keys(result.facets).map((type) => {
        if (typeof result.facets[type] === 'object') {
          return new SearchFacet({
            type,
            ...result.facets[type],
          });
        }
        return {
          type,
          count: result.facets[type],
        };
      }),
    };
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
