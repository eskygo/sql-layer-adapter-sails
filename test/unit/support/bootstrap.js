/**
 * FoundationDB SQL Layer Adapter
 * Copyright © 2013 Cody Stoltman
 * Copyright (c) 2014 FoundationDB, LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Support functions for helping with Postgres tests
 */

var pg = require('pg'),
    _ = require('lodash'),
    adapter = require('../../../lib/adapter');

var Support = module.exports = {};

Support.Config = {
  host: 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: 'sailspg',
  port: 15432
};

// Fixture Collection Def
Support.Collection = function(name) {
  return {
    identity: name,
    connection: 'test',
    definition: Support.Definition
  };
};

// Fixture Table Definition
Support.Definition = {
  field_1: { type: 'string' },
  field_2: { type: 'string' },
  id: {
    type: 'integer',
    autoIncrement: true,
    defaultsTo: 'AUTO_INCREMENT',
    primaryKey: true
  }
};

// Register and Define a Collection
Support.Setup = function(tableName, cb) {

  var collection = Support.Collection(tableName);

  var collections = {};
  collections[tableName] = collection;

  var connection = _.cloneDeep(Support.Config);
  connection.identity = 'test';

  adapter.registerConnection(connection, collections, function(err) {
    if(err) return cb(err);
    adapter.define('test', tableName, Support.Definition, function(err) {
      if(err) return cb(err);
      cb();
    });
  });
};

// Just register a connection
Support.registerConnection = function(tableNames, cb) {
  var collections = {};

  tableNames.forEach(function(name) {
    var collection = Support.Collection(name);
    collections[name] = collection;
  });

  var connection = _.cloneDeep(Support.Config);
  connection.identity = 'test';

  adapter.registerConnection(connection, collections, cb);
};

// Remove a table
Support.Teardown = function(tableName, cb) {
  pg.connect(Support.Config, function(err, client, done) {
    dropTable(tableName, client, function(err) {
      if(err) {
        done();
        return cb(err);
      }

      adapter.teardown('test', function(err) {
        done();
        cb();
      });

    });
  });
};

// Return a client used for testing
Support.Client = function(cb) {
  pg.connect(Support.Config, cb);
};

// Seed a record to use for testing
Support.Seed = function(tableName, cb) {
  pg.connect(Support.Config, function(err, client, done) {
    createRecord(tableName, client, function(err) {
      if(err) {
        done();
        return cb(err);
      }

      done();
      cb();
    });
  });
};

function dropTable(table, client, cb) {
  table = '"' + table + '"';

  var query = "DROP TABLE " + table + ';';
  adapter.query('test', table, query, cb);
}

function createRecord(table, client, cb) {
  table = '"' + table + '"';

  var query = [
  "INSERT INTO " + table + ' (field_1, field_2)',
  "values ('foo', 'bar');"
  ].join('');

  client.query(query, cb);
}
