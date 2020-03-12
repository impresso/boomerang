const assert = require('assert');
const { SolrNamespaces } = require('../../../src/solr');
const { filtersToSolr } = require('../../../src/util/solr/filterReducers');

describe('filtersToSolr', () => {
  it('throws an error for an unknown filter type', () => {
    const filter = {
      type: 'booomooo',
    };
    assert.throws(
      () => filtersToSolr(filter.type, [filter], SolrNamespaces.Search),
      new Error(`Unknown filter type "${filter.type}" in namespace "${SolrNamespaces.Search}"`),
    );
  });

  it('handles "minLengthOne" filter', () => {
    const filter = {
      type: 'hasTextContents',
    };
    const query = filtersToSolr(filter.type, [filter], SolrNamespaces.Search);
    assert.equal(query, 'content_length_i:[1 TO *]');
  });

  describe('handles "numericRange" filter', () => {
    it('with string', () => {
      const filter = {
        q: '1 TO 10',
        type: 'ocrQuality',
      };
      const query = filtersToSolr(filter.type, [filter], SolrNamespaces.Search);
      assert.equal(query, 'ocrqa_f:[1 TO 10]');
    });

    it('with array', () => {
      const filter = {
        q: ['2', '20'],
        type: 'ocrQuality',
      };
      const query = filtersToSolr(filter.type, [filter], SolrNamespaces.Search);
      assert.equal(query, 'ocrqa_f:[2 TO 20]');
    });

    it('throws an error with malformed string', () => {
      const filter = {
        q: 'foo bar',
        type: 'ocrQuality',
      };
      assert.throws(
        () => filtersToSolr(filter.type, [filter], SolrNamespaces.Search),
        new Error(`"numericRange" filter rule: unknown value encountered in "q": ${filter.q}`),
      );
    });
  });

  it('handles "boolean" filter', () => {
    const filter = {
      type: 'isFront',
    };
    const query = filtersToSolr(filter.type, [filter], SolrNamespaces.Search);
    assert.equal(query, 'front_b:1');
  });

  describe('handles "string" filter', () => {
    it('with string', () => {
      const filter = {
        q: 'moo',
        type: 'title',
      };
      const query = filtersToSolr(filter.type, [filter], SolrNamespaces.Search);
      assert.equal(query, '(title_txt_en:moo OR title_txt_fr:moo OR title_txt_de:moo)');
    });

    it('with array', () => {
      const filter = {
        q: ['foo'],
        type: 'title',
      };
      const query = filtersToSolr(filter.type, [filter], SolrNamespaces.Search);
      assert.equal(query, '(title_txt_en:foo OR title_txt_fr:foo OR title_txt_de:foo)');
    });
  });
});
