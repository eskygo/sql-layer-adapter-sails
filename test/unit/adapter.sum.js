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
   * SUM
   *
   * Adds a SUM select parameter to a sql statement
   */

  describe('.sum()', function() {

    describe('with array', function() {

      // Lookup criteria
      var criteria = {
        where: {
          name: 'foo'
        },
        sum: ['age']
      };

      it('should use the SUM aggregate option in the select statement', function() {
        var query = new Query({ name: { type: 'text' }}).find('test', criteria);
        var sql = 'SELECT CAST(SUM(\"test\".\"age\") AS float) AS age FROM \"test\" WHERE ' +
                  'LOWER(\"test\".\"name\") = $1';

        query.query.should.eql(sql);
      });
    });

    describe('with string', function() {

      // Lookup criteria
      var criteria = {
        where: {
          name: 'foo'
        },
        sum: 'age'
      };

      it('should use the SUM aggregate option in the select statement', function() {
        var query = new Query({ name: { type: 'text' }}).find('test', criteria);
        var sql = 'SELECT CAST(SUM(\"test\".\"age\") AS float) AS age FROM \"test\" WHERE ' +
                  'LOWER(\"test\".\"name\") = $1';

        query.query.should.eql(sql);
      });
    });

  });
});
