const assert = require('assert');
const app = require('../../src/app');
const stringify = require('csv-stringify-as-promised');
const fs = require('fs');

/**
 * use with
  ./node_modules/.bin/eslint test/services/search-exporter.test.js  \
  src/services/search-exporter src/hooks --fix \
  && DEBUG=impresso/* mocha test/services/search-exporter.test.js
 */
describe('\'search-exporter\' service', function () {
  this.timeout(20000);
  const service = app.service('search-exporter');

  it('registered the service', () => {
    assert.ok(service, 'Registered the service');
  });

  it('given a search, return the metadata', async () => {
    const results = await service.find({
      user: {
        is_staff: true,
      },
      query: {
        format: 'csv',
        group_by: 'articles',
        skip: 0,
        filters: [
          {
            type: 'string',
            context: 'include',
            q: 'europ* OR Osteurop*',
          },
          {
            type: 'daterange',
            context: 'include',
            daterange: '1939-01-09T00:00:00Z TO 1945-05-08T00:00:00Z',
          },
        ],
      },
    }).catch((err) => {
      assert.fail(err);
    });

    const csv = await stringify(results.records, {
      delimiter: ';',
      header: true,
    });

    fs.writeFileSync('./results-1000.csv', csv);

    // limit should be the default one, even if the user has set 30000
    // console.log(csv);
    assert.ok(results, 'returned CSV');
  });
});
