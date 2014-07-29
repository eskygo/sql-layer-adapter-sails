## FoundationDB SQL Layer Sails/Waterline Adapter

The [FoundationDB SQL Layer](https://github.com/FoundationDB/sql-layer) is a
full SQL implementation built on the [FoundationDB](https://foundationdb.com)
storage substrate. It provides high performance, multi-node scalability,
fault-tolerance and true multi-key ACID transactions.

This project provides adapter integration for [Waterline](https://github.com/balderdashy/waterline), 
the default ORM for [Sails](https://github.com/balderdashy/sails).

### Installation

Installation is through NPM.

```bash
$ npm install sails-fdb
```

### Quick Start

> Important:
>
> The [SQL Layer](https://foundationdb.com/layers/sql/) should be installed and running
> before attempting to use this adapter.
>

1. Add the dependency to `package.json`:
    - Unreleased development version:
        - `gem 'sequel-fdbsql-adapter', github: 'FoundationDB/sql-layer-adapter-sequel'`
2. Install the new gem
    - `$ bundle install`
3. Connect
    ```
    require 'sequel'
    require 'sequel-fdbsql-adapter'

    DB = Sequel.connect('fdbsql://user@localhost:15432/schema_name')
    ```


### Contributing

1. Fork
2. Branch
3. Commit
4. Pull Request

If you would like to contribute a feature or fix, thanks! Please make
sure any changes come with new tests to ensure acceptance. Please read
the `RUNNING_UNIT_TESTS.md` file for more details.

### Contact

* GitHub: http://github.com/FoundationDB/sql-layer-adapter-sequel
* Community: http://community.foundationdb.com
* IRC: #FoundationDB on irc.freenode.net

### License

The MIT License (MIT)

Copyright (c) 2013-2014 FoundationDB, LLC

It is free software and may be redistributed under the terms specified in the LICENSE file.










![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)

# PostgreSQL Sails/Waterline Adapter

[![Build Status](https://travis-ci.org/balderdashy/sails-postgresql.png?branch=master)](https://travis-ci.org/balderdashy/sails-postgresql) [![NPM version](https://badge.fury.io/js/sails-postgresql.png)](http://badge.fury.io/js/sails-postgresql) [![Dependency Status](https://gemnasium.com/balderdashy/sails-postgresql.png)](https://gemnasium.com/balderdashy/sails-postgresql)

A [Waterline](https://github.com/balderdashy/waterline) adapter for FoundationDB. May be used in a [Sails](https://github.com/balderdashy/sails) app or anything using Waterline for the ORM.

## Install

Install is through NPM.

```bash
$ npm install sails-fdb
```

## Configuration

The following config options are available along with their default values:

```javascript
config: {
  database: 'databaseName',
  host: 'localhost',
  user: 'root',
  password: '',
  port: 15432,
  pool: false,
  ssl: false
};
```
Alternatively, you can supply the connection information in URL format:
```javascript
config: {
  url: 'postgres://username:password@hostname:port/database',
  pool: false,
  ssl: false
};
```

## Testing

Test are written with mocha. Integration tests are handled by the [waterline-adapter-tests](https://github.com/balderdashy/waterline-adapter-tests) project, which tests adapter methods against the latest Waterline API.

To run tests:

```bash
$ npm test
```

## About Waterline

Waterline is a new kind of storage and retrieval engine.  It provides a uniform API for accessing stuff from different kinds of databases, protocols, and 3rd party APIs.  That means you write the same code to get users, whether they live in mySQL, LDAP, MongoDB, or Facebook.

To learn more visit the project on GitHub at [Waterline](https://github.com/balderdashy/waterline).
