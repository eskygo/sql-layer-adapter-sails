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
   * SORT
   *
   * Adds an ORDER BY parameter to a sql statement
   */

  describe('.sort()', function() {

    it('should append the ORDER BY clause to the query', function() {

      // Lookup criteria
      var criteria = {
        where: {
          name: 'foo'
        },
        sort: {
          name: 1
        }
      };

      var schema = {
        test: {
          name: { type: 'text' }
        }
      };

      var query = new Query({ name: { type: 'text' }}, schema).find('test', criteria);
      var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."name") = $1 ' +
                'ORDER BY "test"."name" ASC';

      query.query.should.eql(sql);
    });

    it('should sort by multiple columns', function() {

      // Lookup criteria
      var criteria = {
        where: {
          name: 'foo'
        },
        sort: {
          name: 1,
          age: 1
        }
      };

      var schema = {
        test: {
          name: { type: 'text' }
        }
      };

      var query = new Query({ name: { type: 'text' }}, schema).find('test', criteria);
      var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."name") = $1 ' +
                'ORDER BY "test"."name" ASC, "test"."age" ASC';

      query.query.should.eql(sql);
    });

    it('should allow desc and asc ordering', function() {

      // Lookup criteria
      var criteria = {
        where: {
          name: 'foo'
        },
        sort: {
          name: 1,
          age: -1
        }
      };

      var schema = {
        test: {
          name: { type: 'text' }
        }
      };

      var query = new Query({ name: { type: 'text' }}, schema).find('test', criteria);
      var sql = 'SELECT "test"."name" FROM "test" WHERE LOWER("test"."name") = $1 ' +
                'ORDER BY "test"."name" ASC, "test"."age" DESC';

      query.query.should.eql(sql);
    });

  });
});
