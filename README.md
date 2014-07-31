## FoundationDB SQL Layer Sails/Waterline Adapter

The [FoundationDB SQL Layer](https://github.com/FoundationDB/sql-layer) is a
full SQL implementation built on the [FoundationDB](https://foundationdb.com)
storage substrate. It provides high performance, multi-node scalability,
fault-tolerance and true multi-key ACID transactions.

This project provides adapter integration for [Waterline](https://github.com/balderdashy/waterline), 
the default ORM for [Sails](https://github.com/balderdashy/sails). Adapted from the Waterline [PostgreSQL adapter](https://github.com/balderdashy/sails-postgresql).

### Installation

Installation is through NPM.

```bash
$ npm install sails-fdbsql
```

### Configuration

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
  url: 'fdb://username:password@hostname:port/database',
  pool: false,
  ssl: false
};
```


## Testing

Test are written with mocha. To run tests:

```bash
$ npm test
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

* GitHub: http://github.com/FoundationDB/sql-layer-adapter-sails
* Community: http://community.foundationdb.com
* IRC: #FoundationDB on irc.freenode.net

### License

The MIT License (MIT)

Copyright (c) 2013-2014 FoundationDB, LLC

It is free software and may be redistributed under the terms specified in the LICENSE file.


