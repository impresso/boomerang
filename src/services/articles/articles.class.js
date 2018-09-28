const Neo4jService = require('../neo4j.service').Service;
const solr = require('../../solr');
const { NotFound } = require('@feathersjs/errors');
const article = require('../../models/articles.model');

class Service extends Neo4jService {
  constructor(options) {
    super(options);
    this.solr = solr.client(options.app.get('solr'));
  }

  async get(id, params) {
    const uids = id.split(',');

    const results = await Promise.all([
      // we perform a solr request to get
      // the full text, regions of the specified article
      this.solr.findAll({
        q: `id:${uids.join(' OR ')}`,
        fl: uids.length > 1? article.ARTICLE_SOLR_FL_LITE : article.ARTICLE_SOLR_FL,
      }, article.solrFactory),
      // at the same time, we use the neo4jService get to get article instance from our graph db
      super.get(id, {
        ... params,
        findAll: true,
      }),
    ]);

    if (results[0].response.numFound !== 1) {
      throw new NotFound();
    }

    // if params findall was true or when multiple ids are given, results[1] is an array.
    if (Array.isArray(results[1].data) && results[1].data.length) {
      return {
        ...results[0].response.docs[0],
        ...results[1].data[0],
      };
    }

    return results[0].response.docs[0];
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
