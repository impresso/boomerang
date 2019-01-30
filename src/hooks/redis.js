/* eslint-disable consistent-return */
const debug = require('debug')('impresso/hooks:redis');
const feathers = require('@feathersjs/feathers');
const { generateHash } = require('../crypto');

/**
 * Use in Before hooks. Looks for cache content; if the result exists,
 * flushes the result.
 * When context.result is set in a before hook, the original service method
 * call will be skipped. All other hooks will still execute in their normal order.
 *
 * This hook adds `context.params.cacheKey` only if a redisClient exists
 * and it has been properly configured.
 *
 * If no redis content matches the `context.params.cacheKey`, the after hooks
 * `saveResultsInCache` can use the key to store contents in cache.
 *
 * Note: this hook should be used for find and get method only
 * ça va sans dire
 *
 * @return {feathers.SKIP or undefined} if undefined, following hooks will be loaded
 */
const checkCachedContents = ({
  useAuthenticatedUser = true,
} = {}) => async (context) => {
  const client = context.app.get('redisClient');
  debug(`checkCachedContents; enabled: ${client !== null}, useAuthenticatedUser: ${useAuthenticatedUser}`);
  if (!client) {
    return;
  }

  const keyParts = [`${context.service.name}.${context.method}`];

  if (!context.params) {
    context.params = {};
  }


  if (useAuthenticatedUser && context.params.user) {
    // prepend user specific cache.
    keyParts.shift(context.params.user.uid);
  }

  if (context.id) {
    keyParts.push(context.id);
  }

  if (context.params.query) {
    const qs = JSON.stringify(context.params.query);
    keyParts.push(qs.length < 64 ? qs : generateHash(context.params.query));
  }

  // generate key from parameters.
  context.params.cacheKey = keyParts.join('::');


  // look for cache
  const value = await client.get(context.params.cacheKey);

  debug(`checkCachedContents; cacheKey: ${context.params.cacheKey}, exists: ${!!value}`);

  if (value) {
    // setting `result` makes feathers ignore
    // following before hooks and service method.
    context.result = JSON.parse(value);
    context.params.isCached = true;
    return feathers.SKIP;
  }
};

/**
 * Use in after hooks, should be the first hook.
 * It flushes the result
 *
 * @return {feathers.SKIP or undefined}
 */
const returnCachedContents = ({
  skipHooks = true,
} = {}) => (context) => {
  debug(`returnCachedContents: ${!!context.params.isCached}`);
  if (context.params.isCached) {
    if (typeof context.result === 'object') {
      context.result.cached = true;
    }
    if (skipHooks) {
      return feathers.SKIP;
    }
  }
};

/**
 * [saveResultsInCache description]
 * @return {[type]} [description]
 */
const saveResultsInCache = () => async (context) => {
  const client = context.app.get('redisClient');
  if (!client || !context.params.cacheKey) {
    return;
  }
  debug('saveResultsInCache', context.params.cacheKey);
  if (!context.params.isCached) {
    // do not override cached contents. See returnCachedContents
    await client.set(context.params.cacheKey, JSON.stringify(context.result));
  }
};

module.exports = {
  checkCachedContents,
  returnCachedContents,
  saveResultsInCache,
};
