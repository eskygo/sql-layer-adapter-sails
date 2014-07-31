/**
 * FoundationDB SQL Layer Sequel Adapter
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

var Query = require('../../lib/query'),
    should = require('should');

describe('query', function() {

  /**
   * WHERE
   *
   * Build the WHERE part of an sql statement from a js object
   */

  describe('.where()', function() {

    describe('`AND` criteria', function() {

      describe('case insensitivity', function() {

        // Lookup criteria
        var criteria = {
          where: {
            name: 'Foo',
            age: 1
          }
        };

        var schema = {
          test: {
            name: { type: 'text' }
          }
        };

        it('should build a SELECT statement using LOWER() on strings', function() {
          var query = new Query({ name: { type: 'text' }, age: { type: 'integer'}}, schema)
                      .find('test', criteria);

          var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."name") = $1 ' +
                    'AND "test"."age" = $2';

          query.query.should.eql(sql);
          query.values[0].should.eql('foo');
        });
      });

      describe('criteria is simple key value lookups', function() {

        // Lookup criteria
        var criteria = {
          where: {
            name: 'foo',
            age: 27
          }
        };

        var schema = {
          test: {
            name: { type: 'text' }
          }
        };

        it('should build a simple SELECT statement', function() {
          var query = new Query({ name: { type: 'text' }, age: { type: 'integer'}}, schema)
                      .find('test', criteria);

          var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."name") = $1 ' +
                    'AND "test"."age" = $2';

          query.query.should.eql(sql);
          query.values.length.should.eql(2);
        });

      });

      describe('has multiple comparators', function() {

        // Lookup criteria
        var criteria = {
          where: {
            name: 'foo',
            age: {
              '>' : 27,
              '<' : 30
            }
          }
        };

        var schema = {
          test: {
            name: { type: 'text' }
          }
        };

        it('should build a SELECT statement with comparators', function() {
          var query = new Query({ name: { type: 'text' }, age: { type: 'integer'}}, schema)
                      .find('test', criteria);

          var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."name") = $1 ' +
                    'AND "test"."age" > $2 AND "test"."age" < $3 ';

          query.query.should.eql(sql);
          query.values.length.should.eql(3);
        });

      });
    });

    describe('`LIKE` criteria', function() {

      // Lookup criteria
      var criteria = {
        where: {
          like: {
            type: '%foo%',
            name: 'bar%'
          }
        }
      };

      var schema = {
        test: {
          name: { type: 'text' }
        }
      };

      it('should build a SELECT statement with LIKE', function() {
        var query = new Query({ type: { type: 'text' }, name: { type: 'text'}}, schema)
                    .find('test', criteria);

        var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."type") LIKE $1 ' +
                  'AND LOWER("test"."name") LIKE $2';

        query.query.should.eql(sql);
        query.values.length.should.eql(2);
      });

    });

    describe('`OR` criteria', function() {

      // Lookup criteria
      var criteria = {
        where: {
          or: [
            { like: { foo: '%foo%' } },
            { like: { bar: '%bar%' } }
          ]
        }
      };

      var schema = {
        test: {
          name: { type: 'text' }
        }
      };

      it('should build a SELECT statement with multiple like statements', function() {
        var query = new Query({ foo: { type: 'text' }, bar: { type: 'text'}}, schema)
                    .find('test', criteria);

        var sql = 'SELECT "test"."name" FROM "test" WHERE ((LOWER("test"."foo") LIKE $1) ' +
                  'OR (LOWER("test"."bar") LIKE $2))';

        query.query.should.eql(sql);
        query.values.length.should.eql(2);
      });
    });

    describe('`IN` criteria', function() {

      // Lookup criteria
      var criteria = {
        where: {
          name: [
            'foo',
            'bar',
            'baz'
          ]
        }
      };

      var schema = {
        test: {
          name: { type: 'text' }
        }
      };

      var camelCaseCriteria = {
        where: {
          myId: [
            1,
            2,
            3
          ]
        }
      };

      it('should build a SELECT statement with an IN array', function() {
        var query = new Query({ name: { type: 'text' }}, schema).find('test', criteria);
        var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."name") IN ($1, $2, $3)';

        query.query.should.eql(sql);
        query.values.length.should.eql(3);
      });

      it('should build a SELECT statememnt with an IN array and camel case column', function() {
        var query = new Query({ myId: { type: 'integer' }}, schema).find('test', camelCaseCriteria);

        query.query.should.eql('SELECT "test"."name" FROM "test" WHERE "test"."myId" IN ($1, $2, $3)');
        query.values.length.should.eql(3);
      });

    });

    describe('`NOT` criteria', function() {

      // Lookup criteria
      var criteria = {
        where: {
          age: {
            not: 40
          }
        }
      };

      var schema = {
        test: {
          name: { type: 'text' }
        }
      };

      it('should build a SELECT statement with an NOT clause', function() {
        var query = new Query({age: { type: 'integer'}}, schema).find('test', criteria);

        query.query.should.eql('SELECT "test"."name" FROM "test" WHERE "test"."age" <> $1 ');
        query.values.length.should.eql(1);
      });

    });

  });
});
