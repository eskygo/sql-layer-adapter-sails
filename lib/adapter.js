/*---------------------------------------------------------------
  :: sails-postgresql
  -> adapter
---------------------------------------------------------------*/

// Dependencies
var pg = require('pg');
var _ = require('lodash');
var url = require('url');
var async = require('async');
var Errors = require('waterline-errors').adapter;
var Query = require('./query');
var utils = require('./utils');

module.exports = (function() {

  // Keep track of all the connections used by the app
  var connections = {};

  var adapter = {
    identity: 'sails-fdb',

    // Which type of primary key is used by default
    pkFormat: 'integer',

    syncable: true,

    defaults: {
      host: 'localhost',
      port: 15432,
      schema: true,
      ssl: false
    },

    /*************************************************************************/
    /* Public Methods for Sails/Waterline Adapter Compatibility              */
    /*************************************************************************/

    // Register a new DB Connection
    registerConnection: function(connection, collections, cb) {

      var self = this;

      if(!connection.identity) return cb(Errors.IdentityMissing);
      if(connections[connection.identity]) return cb(Errors.IdentityDuplicate);

      // Store the connection
      connections[connection.identity] = {
        config: connection,
        collections: collections
      };

      // Always call describe
      async.map(Object.keys(collections), function(colName, cb){
        self.describe(connection.identity, colName, cb);
      }, cb);
    },

    // Teardown
    teardown: function(connectionName, cb) {
      if(!connections[connectionName]) return cb();
      delete connections[connectionName];
      cb();
    },

    // Raw Query Interface
    query: function(connectionName, table, query, data, cb) {

      if (_.isFunction(data)) {
        cb = data;
        data = null;
      }

      spawnConnection(connectionName, function __QUERY__(client, cb) {

        // Run query
        if (data) client.query(query, data, cb);
        else client.query(query, cb);

      }, cb);
    },

    // Describe a table
    describe: function(connectionName, table, cb) {
      spawnConnection(connectionName, function __DESCRIBE__(client, cb) {

        var connectionObject = connections[connectionName];
        var collection = connectionObject.collections[table];

        // Build query to get a bunch of info from the information_schema
        // It's not super important to understand it only that it returns the following fields:
        // [Table, #, Column, Type, Null, Default, Index, Constraint]
        var query = "SELECT c.table_schema || '.' || c.table_name AS \"Table\", c.ordinal_position AS \"#\", c.column_name AS \"Column\", c.data_type AS \"Type\", " +
          "case c.is_nullable when 'NO' then 'NOT NULL' else '' end as \"NULL\", c.sequence_name, i.index_name, tc.constraint_type FROM information_schema.columns AS c " +
          "LEFT JOIN information_schema.key_column_usage AS kcu ON c.table_schema = kcu.table_schema and c.table_name = kcu.table_name and " +
          "c.column_name = kcu.column_name LEFT JOIN information_schema.table_constraints AS tc on kcu.table_schema = tc.table_schema and " +
          "kcu.table_name = tc.table_name and tc.constraint_name = kcu.constraint_name LEFT JOIN information_schema.index_columns AS i ON " +
          "c.table_schema = i.column_schema and c.table_name = i.column_table and c.column_name = i.column_name " +
          "WHERE c.table_name = '" + table + "' order by 1,2;"

        // Run Info Query
        client.query(query, function(err, result) {
          if(err) return cb();
          if(result.rows.length === 0) return cb();

          _.each(result.rows, (function(column) {
            if(column.sequence_name) column.autoincrement = true;
            if(column.index_name) column.indexed = true;
          }));

          // Normalize Schema
          var normalizedSchema = utils.normalizeSchema(result.rows);

          // Set Internal Schema Mapping
          collection.schema = normalizedSchema;

          cb(null, normalizedSchema);
        });
      }, cb);
    },

    // Create a new table
    define: function(connectionName, table, definition, cb) {

      // Create a describe method to run after the define.
      // Ensures the define connection is properly closed.
      var describe = function(err, result) {
        if(err) return cb(err);

        // Describe (sets schema)
        adapter.describe(connectionName, table.replace(/["']/g, ""), cb);
      };

      spawnConnection(connectionName, function __DEFINE__(client, cb) {

        // Escape Table Name
        table = utils.escapeName(table);

        // Iterate through each attribute, building a query string
        var _schema = utils.buildSchema(definition);

        // Check for any Index attributes
        var indexes = utils.buildIndexes(definition);

        // Build Query
        var query = 'CREATE TABLE ' + table + ' (' + _schema + ')';

        // Run Query
        client.query(query, function __DEFINE__(err, result) {
          if(err) return cb(err);

          // Build Indexes
          function buildIndex(name, cb) {

            // Strip slashes from table name, used to namespace index
            var cleanTable = table.replace(/['"]/g, '');

            // Build a query to create a namespaced index tableName_key
            var query = 'CREATE INDEX ' + utils.escapeName(cleanTable + '_' + name) + ' on ' + table + ' (' + utils.escapeName(name) + ');';

            // Run Query
            client.query(query, function(err, result) {
              if(err) return cb(err);
              cb();
            });
          }

          // Build indexes in series
          async.eachSeries(indexes, buildIndex, cb);
        });

      }, describe);
    },

    // Drop a table
    drop: function(connectionName, table, relations, cb) {

      if(typeof relations === 'function') {
        cb = relations;
        relations = [];
      }

      spawnConnection(connectionName, function __DROP__(client, cb) {

        // Drop any relations
        function dropTable(item, next) {

          // Build Query
          var query = 'DROP TABLE ' + utils.escapeName(item) + ';';

          // Run Query
          client.query(query, function __DROP__(err, result) {
            if(err) result = null;
            next(null, result);
          });
        }

        async.eachSeries(relations, dropTable, function(err) {
          if(err) return cb(err);
          dropTable(table, cb);
        });

      }, cb);
    },

    // Add a column to a table
    addAttribute: function(connectionName, table, attrName, attrDef, cb) {
      spawnConnection(connectionName, function __ADD_ATTRIBUTE__(client, cb) {

        // Escape Table Name
        table = utils.escapeName(table);

        // Setup a Schema Definition
        var attrs = {};
        attrs[attrName] = attrDef;

        var _schema = utils.buildSchema(attrs);

        // Build Query
        var query = 'ALTER TABLE ' + table + ' ADD COLUMN ' + _schema;

        // Run Query
        client.query(query, function __ADD_ATTRIBUTE__(err, result) {
          if(err) return cb(err);
          cb(null, result.rows);
        });

      }, cb);
    },

    // Remove a column from a table
    removeAttribute: function (connectionName, table, attrName, cb) {
      spawnConnection(connectionName, function __REMOVE_ATTRIBUTE__(client, cb) {

        // Escape Table Name
        table = utils.escapeName(table);

        // Build Query
        var query = 'ALTER TABLE ' + table + ' DROP COLUMN "' + attrName + '" RESTRICT';

        // Run Query
        client.query(query, function __REMOVE_ATTRIBUTE__(err, result) {
          if(err) return cb(err);
          cb(null, result.rows);
        });

      }, cb);
    },

    // Add a new row to the table
    create: function(connectionName, table, data, cb) {
      spawnConnection(connectionName, function __CREATE__(client, cb) {

        var connectionObject = connections[connectionName];
        var collection = connectionObject.collections[table];

        var schemaName = collection.meta && collection.meta.schemaName ? utils.escapeName(collection.meta.schemaName) + '.' : '';
        var tableName = schemaName + utils.escapeName(table);

        // Build a Query Object
        var _query = new Query(collection.definition);

        // Cache the original table name for later use
        var originalTable = _.clone(table);

        // Transform the Data object into arrays used in a parameterized query
        var attributes = utils.mapAttributes(data);
        var columnNames = attributes.keys.join(', ');
        var paramValues = attributes.params.join(', ');

        var incrementSequences = [];

        // Loop through all the attributes being inserted and check if a sequence was used
        Object.keys(collection.schema).forEach(function(schemaKey) {
          if(!utils.object.hasOwnProperty(collection.schema[schemaKey], 'autoIncrement')) return;
          if(Object.keys(data).indexOf(schemaKey) < 0) return;
          incrementSequences.push(schemaKey);
        });

        // Build Query
        var query = 'INSERT INTO ' + tableName + ' (' + columnNames + ') values (' + paramValues + ') RETURNING *';

        // Run Query
        client.query(query, attributes.values, function __CREATE__(err, result) {
          if(err) return cb(err);

          // Cast special values
          var values = _query.cast(result.rows[0]);
          console.log("create0: " + query);
          // Set Sequence value to defined value if needed
          if(incrementSequences.length === 0) return cb(null, values);
          console.log("create: ");
          console.log(incrementSequences);
          function setSequence(item, next) {
            var sequenceName = "'" + originalTable + '_' + item + '_seq' + "'";
            var sequenceValue = values[item];
            var sequenceQuery = 'CALL sys.alter_seq_restart(\'' + client.database + '\', ' + sequenceName + ', ' + sequenceValue + ')';

            client.query(sequenceQuery, function(err, result) {
              if(err) return next(err);
              next();
            });
          }

          client.query("COMMIT", function(err, result) {
            if(err) return cb(err);
            async.each(incrementSequences, setSequence, function(err) {
              if (err) return cb(err);
              client.query("BEGIN", function(err, result) {
                cb(null, values);
              });
            });
          });
        });

      }, cb);
    },

    // Add multiple rows to the table
    createEach: function(connectionName, table, records, cb) {
      spawnConnection(connectionName, function __CREATE_EACH__(client, cb) {

        var connectionObject = connections[connectionName];
        var collection = connectionObject.collections[table];

        var schemaName = collection.meta && collection.meta.schemaName ? utils.escapeName(collection.meta.schemaName) + '.' : '';
        var tableName = schemaName + utils.escapeName(table);

        var incrementSequences = [];
        console.log("records!");
        console.log(records);
        // Loop through all the attributes being inserted and check if a sequence was used
        Object.keys(collection.schema).forEach(function(schemaKey) {
          if(!utils.object.hasOwnProperty(collection.schema[schemaKey], 'autoIncrement')) return;
          records.forEach(function(record) {
            if (Object.keys(record).indexOf(schemaKey) < 0) return;
            incrementSequences[schemaKey] = 0;
          });
        });

        // Build a Query Object
        var _query = new Query(collection.definition);

        // Collect Query Results
        var results = [];

        // Simple way for now, in the future make this more awesome
        async.each(records, function(data, cb) {

          // Transform the data object into arrays for parameterized query
          var attributes = utils.mapAttributes(data);
          var columnNames = attributes.keys.join(', ');
          var paramValues = attributes.params.join(', ');

          // Build Query
          var query = 'INSERT INTO ' + tableName + ' (' + columnNames +
            ') values (' + paramValues + ') RETURNING *';

          console.log(query);
          console.log(attributes.values);

          // Run Query
          client.query(query, attributes.values, function __CREATE_EACH__(err, result) {
            if(err) {
              console.log("error: ");
              console.log(query);
              console.log(attributes.values);
              return cb(err);
            }

            // Cast special values
            var values = _query.cast(result.rows[0]);

            results.push(values);
            if(incrementSequences.length === 0) return cb(null, values);

            function checkSequence(item, next) {
              var currentValue  = item.value;
              var sequenceValue = values[item.key];

              if(currentValue < sequenceValue) {
                item.value = sequenceValue;
              }
              next();
            }

            async.each(incrementSequences, checkSequence, function(err) {
              if(err) return cb(err);
              cb(null, values);
            });
          });

        }, function(err) {
          if(err) return cb(err);
          if(incrementSequences.length === 0) return cb(null, results);
          console.log(incrementSequences);
          function setSequence(item, next) {
            var sequenceName = "'" + table + '_' + item.key + '_seq' + "'";
            var sequenceValue = item.value;
            var sequenceQuery = 'CALL sys.alter_seq_restart(\'' + client.database + '\', ' + sequenceName + ', ' + sequenceValue + ')';
            client.query(sequenceQuery, function(err, result) {
              if(err) return next(err);
              next();
            });
          }

          client.query("COMMIT", function(err, result) {
            if(err) return cb(err);
            async.each(incrementSequences, setSequence, function(err) {
              if (err) return cb(err);
              client.query("BEGIN", function(err, result) {
                cb(null, results);
              });
            });
          });
        });

      }, cb);
    },

    // Select Query Logic
    find: function(connectionName, table, options, cb) {
      spawnConnection(connectionName, function __FIND__(client, cb) {

        // Check if this is an aggregate query and that there is something to return
        if(options.groupBy || options.sum || options.average || options.min || options.max) {
          if(!options.sum && !options.average && !options.min && !options.max) {
            return cb(Errors.InvalidGroupBy);
          }
        }

        var connectionObject = connections[connectionName];
        var collection = connectionObject.collections[table];

        var schemaName = collection.meta && collection.meta.schemaName;

        // Add schemaName information
        if (schemaName) {
          options._schemaName = schemaName;
        }

        // Build a Query Object
        var _query = new Query(collection.definition);

        // Grab Connection Schema
        var schema = {};

        Object.keys(connectionObject.collections).forEach(function(coll) {
          schema[coll] = connectionObject.collections[coll].schema;
        });

        // Build Query
        var _schema = collection.schema;
        var queryObj = new Query(_schema, schema);
        var query = queryObj.find(table, options);

        // Run Query
        client.query(query.query, query.values, function __FIND__(err, result) {
          if(err) return cb(err);

          // Cast special values
          var values = [];

          result.rows.forEach(function(row) {
            values.push(queryObj.cast(row));
          });

          // If a join was used the values should be grouped to normalize the
          // result into objects
          var _values = options.joins ? utils.group(values) : values;

          cb(null, _values);
        });

      }, cb);
    },

    // Stream one or more models from the collection
    stream: function(connectionName, table, options, stream) {

      var connectionObject = connections[connectionName];
      var collection = connectionObject.collections[table];

      var client = new pg.Client(connectionObject.config);
      client.connect();

      var schema = {};

      Object.keys(connectionObject.collections).forEach(function(coll) {
        schema[coll] = connectionObject.collections[coll].schema;
      });

      // Build Query
      var _schema = collection.schema;
      var queryObj = new Query(_schema, schema);
      var query =queryObj.find(table, options);

      // Run Query
      var dbStream = client.query(query.query, query.values);

      //can stream row results back 1 at a time
      dbStream.on('row', function(row) {
        stream.write(row);
      });

      dbStream.on('error', function(err) {
        stream.end(); // End stream
        client.end(); // Close Connection
      });

      //fired after last row is emitted
      dbStream.on('end', function() {
        stream.end(); // End stream
        client.end(); // Close Connection
      });
    },

    // Update one or more models in the collection
    update: function(connectionName, table, options, data, cb) {
      spawnConnection(connectionName, function __UPDATE__(client, cb) {

        var connectionObject = connections[connectionName];
        var collection = connectionObject.collections[table];

        var schemaName = collection.meta && collection.meta.schemaName;

        // Add schemaName information
        if (schemaName) {
          options._schemaName = schemaName;
        }

        // Build a Query Object
        var _query = new Query(collection.definition);

        // Build Query
        var query = new Query(collection.schema).update(table, options, data);

        // Run Query
        client.query(query.query, query.values, function __UPDATE__(err, result) {
          if(err) return cb(err);

          // Cast special values
          var values = [];

          result.rows.forEach(function(row) {
            values.push(_query.cast(row));
          });

          cb(null, values);
        });

      }, cb);
    },

    // Delete one or more models from the collection
    destroy: function(connectionName, table, options, cb) {
      spawnConnection(connectionName, function __DELETE__(client, cb) {

        var connectionObject = connections[connectionName];
        var collection = connectionObject.collections[table];

        var schemaName = collection.meta && collection.meta.schemaName;

        // Add schemaName information
        if (schemaName) {
          options._schemaName = schemaName;
        }

        // Build Query
        var query = new Query(collection.schema).destroy(table, options);

        // Run Query
        client.query(query.query, query.values, function __DELETE__(err, result) {
          if(err) return cb(err);
          cb(null, result.rows);
        });

      }, cb);
    }

  };

  /*************************************************************************/
  /* Private Methods
  /*************************************************************************/

  // Wrap a function in the logic necessary to provision a connection
  // (grab from the pool or create a client)
  function spawnConnection(connectionName, logic, cb) {

    var connectionObject = connections[connectionName];
    if(!connectionObject) return cb(Errors.InvalidConnection);

    // If the connection details were supplied as a URL use that. Otherwise,
    // connect using the configuration object as is.
    var connectionConfig = connectionObject.config;
    if(_.has(connectionConfig, 'url')) {
      connectionUrl = url.parse(connectionConfig.url);
      connectionUrl.query = _.omit(connectionConfig, 'url');
      connectionConfig = url.format(connectionUrl);
    }

    // Grab a client instance from the client pool
    pg.connect(connectionConfig, function(err, client, done) {
      after(err, client, done);
    });

    // Run logic using connection, then release/close it
    function after(err, client, done) {
      if(err) {
        console.error("Error creating a connection to Postgresql: " + err);

        // be sure to release connection
        done();

        return cb(err);
      }

      client.query("BEGIN", function(err, result) {
        if (err) return cb(err, result);
        logic(client, function(err, result) {
          if (err) return cb(err, result);
          client.query("COMMIT", function(commitErr, commitResult) {
            if (commitErr) return cb(commitErr, commitResult);
            // release client connection
            done();
            return cb(err, result);
          });
        });
      });
    }
  }

  return adapter;
})();
