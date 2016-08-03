'use strict';

var Lynx = require('lynx');
var l = require('lodash');
var debug = require('debug')('plugins:statsd');

module.exports = StatsDPlugin;

function StatsDPlugin(config, ee) {
  var self = this;
  self._report = [];

  var host = config.plugins.statsd.host || 'localhost';
  var port = config.plugins.statsd.port || 8125;
  var prefix = config.plugins.statsd.prefix || 'minigun';
  // This is used for testing the plugin interface
  var enableUselessReporting = config.plugins.statsd.enableUselessReporting;

  var metrics = new Lynx(host, port);

  ee.on('stats', function(stats) {
    debug('stats');

    if (enableUselessReporting) {
      self._report.push({ timestamp: stats.timestamp, value: 'test' });
    }

    metrics.gauge(prefix + '.scenariosCreated', stats.scenariosCreated);
    metrics.gauge(prefix + '.scenariosCompleted', stats.scenariosCompleted);
    metrics.gauge(prefix + '.requestsCompleted', stats.requestsCompleted);
    metrics.gauge(prefix + '.concurrency', stats.concurrency || -1);

    metrics.gauge(prefix + '.rps.count', stats.rps.count || -1);
    metrics.gauge(prefix + '.rps.mean', stats.rps.mean || -1);

    metrics.gauge(prefix + '.latency.min', stats.latency.min || -1);
    metrics.gauge(prefix + '.latency.max', stats.latency.max || -1);
    metrics.gauge(prefix + '.latency.median', stats.latency.median || -1);
    metrics.gauge(prefix + '.latency.p95', stats.latency.p95 || -1);
    metrics.gauge(prefix + '.latency.p99', stats.latency.p99 || -1);

    l.each(stats.codes, function(count, errName) {
      metrics.gauge(prefix + '.codes.' + errName, count);
    });

    l.each(stats.errors, function(count, errName) {
      metrics.gauge(prefix + '.errors.' + errName, count);
    });
  });

  ee.on('done', function(stats) {
    debug('done');
    metrics.close();
  });

  return this;
}

StatsDPlugin.prototype.report = function report() {
  if (this._report.length === 0) {
    return null;
  } else {
    this._report.push({
      timestamp: 'aggregate',
      value: {test: 'aggregate test'}
    });
    return this._report;
  }
};
