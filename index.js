'use strict'
const co = require('co');
const fsp = require('fs-promise');
const path = require('path');
const stylus = require('stylus');

/** default config file name */
const defaultConfig = 'stylus.config.js';

module.exports = function(config) {
  const root = process.cwd();
  var baseConfig;
  const configFile = (typeof config === 'string')
    ? config
    : defaultConfig;
  try {
    // console.warn('Loading config from:', configFile);
    baseConfig = require(path.join(root, configFile));
    // console.warn('Loaded Sass config from:', configFile);
  } catch (e) {
    // console.warn('No config file found for felt-stylus in:', configFile);
  }
  if (baseConfig) {
    config = Object.assign(baseConfig, config);
  }

  return co.wrap(function*(from, to) {
    const options = Object.assign({}, config.options, {
      filename: from,
      paths: [path.dirname(from)]
    });

    to = to.replace(/\.styl$/, '.css');
    let styl = yield fsp.readFile(from, 'utf8');
    return yield new Promise((resolve, reject) => {
      stylus.render(styl, options, (error, result) => {
        if (error) {
          reject(error);
        } else {
          const write = fsp.writeFile(to, result)
            .catch(reject);
          if (typeof options.post === 'function') {
            write.then(() => {
              resolve(options.post(to, to));
            });
          } else {
            resolve(write);
          }
        }
      });
    });
  })
};
