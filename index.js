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
  var prefix = config.plugins.statsd.prefix || 'artillery';
  // This is used for testing the plugin interface
  var enableUselessReporting = config.plugins.statsd.enableUselessReporting;

  var client = new StatsD(host, port, prefix);

  ee.on('phaseStarted', function(stats) {
    debug(`host: ${client.host} port: ${client.port} prefix: ${client.prefix}`);
  });

  ee.on('stats', function(stats) {
    debug(stats);

    if (enableUselessReporting) {
      self._report.push({ timestamp: stats.timestamp, value: 'test' });
    }

    client.gauge('.scenariosCreated', stats.scenariosCreated);
    client.gauge('.scenariosCompleted', stats.scenariosCompleted);
    client.gauge('.requestsCompleted', stats.requestsCompleted);
    client.gauge('.concurrency', stats.concurrency);
    client.gauge('.pendingRequests', stats.pendingRequests);
    client.gauge('.rps.count', stats.rps.count);
    client.gauge('.rps.mean', stats.rps.mean);
    client.gauge('.latency.min', stats.latency.min || -1);
    client.gauge('.latency.max', stats.latency.max || -1);
    client.gauge('.latency.median', stats.latency.median || -1);
    client.gauge('.latency.p95', stats.latency.p95 || -1);
    client.gauge('.latency.p99', stats.latency.p99 || -1);

    l.each(stats.codes, function(count, errName) {
      client.gauge(`.codes.${errName}`, count);
      client.gauge('.codes', count, [`code:${errName}`]);
    });

    l.each(stats.errors, function(count, errName) {
      client.gauge(`.errors.${errName}`, count);
      client.gauge('.errors', count, [`error:${errName}`]);
    });
  });

  ee.on('done', function(stats) {
    client.close();
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
