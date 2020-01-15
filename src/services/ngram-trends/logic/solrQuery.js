const {
  get, mergeWith, toPairs,
  fromPairs, sortBy,
} = require('lodash');
const {
  filtersToQueryAndVariables,
  ContentLanguages,
} = require('../../../util/solr');

const TimeIntervalsFilelds = {
  year: 'meta_year_i',
  month: 'meta_yearmonth_s',
  day: 'meta_date_dt',
};

const getFacetPivotString = (languageCode, timeIntervalField) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  `{!stats=tf_stats_${languageCode} key=${languageCode}}${timeIntervalField}`;
const getStatsFieldString = (languageCode, unigram) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  `{!tag=tf_stats_${languageCode} key=tf_stats_${languageCode} sum=true func}termfreq(content_txt_${languageCode},'${unigram}')`;

/**
 * Construct a SOLR query to get unigram trends.
 * The query is a JSON payload to be send as a POST request.
 *
 * @param {string} unigram unigram to get trends for.
 * @param {object[]} filters a list of filters of type `src/schema/search/filter.json`.
 * @param {string[]} facets a list of facets to extract alongside trend.
 *
 * @return {object} a POST JSON payload for SOLR search endpoint.
 */
function unigramTrendsRequestToSolrQuery(unigram, filters, facets = [], timeInterval = 'year') {
  const { query, variables } = filtersToQueryAndVariables(filters);
  const timeIntervalField = TimeIntervalsFilelds[timeInterval];

  const facetPivots = ContentLanguages
    .map(languageCode => getFacetPivotString(languageCode, timeIntervalField));
  const statsFields = ContentLanguages
    .map(languageCode => getStatsFieldString(languageCode, unigram));

  return {
    query,
    limit: 0,
    params: {
      vars: variables,
      facet: true,
      'facet.pivot': facetPivots,
      'stats.field': statsFields,
      stats: true,
      'facet.field': facets.join(','),
      hl: false, // disable duplicate field "highlighting"
    },
  };
}

/**
 * Convert raw SOLR response to `ngram-trends/schema/post/response.json`.
 * @param {object} solrResponse SOLR trends response
 */
function parseUnigramTrendsResponse(solrResponse, unigram) {
  const pivots = get(solrResponse, 'facet_counts.facet_pivot', {});
  const languageCodes = Object.keys(pivots);
  const domainToValuesMapping = languageCodes.reduce((acc, languageCode) => {
    const pivotEntries = pivots[languageCode];
    const entries = pivotEntries.map((entry) => {
      const key = entry.value;
      const value = get(entry, `stats.stats_fields.tf_stats_${languageCode}.sum`);
      return [key, value];
    });
    return mergeWith(acc, fromPairs(entries), (dst, src) => {
      return (dst || 0) + (src || 0);
    });
  }, {});

  const domainAndValueItems = sortBy(toPairs(domainToValuesMapping), ([domain]) => domain);

  const domainValues = domainAndValueItems.map(([domain]) => domain);
  const values = domainAndValueItems.map(([, value]) => value);

  return {
    trends: [
      {
        ngram: unigram,
        values,
      },
    ],
    domainValues,
  };
}

module.exports = {
  unigramTrendsRequestToSolrQuery,
  parseUnigramTrendsResponse,
};
