'use strict';

var StatsD = require('node-statsd')
var l = require('lodash');
var debug = require('debug')('plugins:statsd');

module.exports = StatsDPlugin;

function StatsDPlugin(config, ee) {
  var self = this;
  self._report = [];

  var host = config.plugins.statsd.host || 'localhost';
  var port = config.plugins.statsd.port || 8125;
  var prefix = config.plugins.statsd.prefix || 'artillery.';
  // This is used for testing the plugin interface
  var enableUselessReporting = config.plugins.statsd.enableUselessReporting;

  var metrics = new StatsD(host, port, prefix);

  ee.on('phaseStarted', function(stats) {
    debug(`host: ${metrics.host} port: ${metrics.port} prefix: ${metrics.prefix}`);
  });

  ee.on('stats', function(stats) {
    debug(stats);

    if (enableUselessReporting) {
      self._report.push({ timestamp: stats.timestamp, value: 'test' });
    }

    metrics.gauge('scenariosCreated', stats.scenariosCreated);
    metrics.gauge('scenariosCompleted', stats.scenariosCompleted);
    metrics.gauge('requestsCompleted', stats.requestsCompleted);
    metrics.gauge('concurrency', stats.concurrency || -1);
    metrics.gauge('pendingRequests', stats.pendingRequests || -1);

    metrics.gauge('rps.count', stats.rps.count || -1);
    metrics.gauge('rps.mean', stats.rps.mean || -1);

    metrics.gauge('latency.min', stats.latency.min || -1);
    metrics.gauge('latency.max', stats.latency.max || -1);
    metrics.gauge('latency.median', stats.latency.median || -1);
    metrics.gauge('latency.p95', stats.latency.p95 || -1);
    metrics.gauge('latency.p99', stats.latency.p99 || -1);

    l.each(stats.codes, function(count, errName) {
      metrics.gauge('codes', count, [`code:${errName}`]);
    });

    l.each(stats.errors, function(count, errName) {
      metrics.gauge('errors', count, [`error:${errName}`]);
    });
  });

  ee.on('done', function(stats) {
    metrics.close();
    debug('done');
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
