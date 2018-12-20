const debug = require('debug')('impresso/services:newspapers');

const SequelizeService = require('../sequelize.service');
const Newspaper = require('../../models/newspapers.model');


class Service {
  constructor({
    app,
    name = ''
  }= {}){
    this.app = app;
    this.SequelizeService = SequelizeService({
      app,
      name,
    });
  }
  async find(params) {
    debug(`find '${this.name}': with params.isSafe:${params.isSafe} and params.query:`, params.query);

    const where = {};

    if (params.query.q) {
      where.name = params.query.q;
    }

    return this.SequelizeService.find({
      ...params,
      scope: 'findAll',
      where,
    });
  }
}

module.exports = function (options) {
  return new Service(options);
};
module.exports.Service = Service;
