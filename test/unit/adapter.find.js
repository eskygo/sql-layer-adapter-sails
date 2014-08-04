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

var adapter = require('../../lib/adapter'),
    should = require('should'),
    support = require('./support/bootstrap');

describe('adapter', function() {

  /**
   * Setup and Teardown
   */

  before(function(done) {
    support.Setup('test_find', done);
  });

  after(function(done) {
    support.Teardown('test_find', done);
  });

  /**
   * FIND
   *
   * Returns an array of records from a SELECT query
   */

  describe('.find()', function() {

    describe('WHERE clause', function() {

      before(function(done) {
        support.Seed('test_find', done);
      });

      describe('key/value attributes', function() {

        it('should return the record set', function(done) {
          adapter.find('test', 'test_find', { where: { field_1: 'foo' } }, function(err, results) {
            results.length.should.eql(1);
            results[0].id.should.eql(1);
            done();
          });
        });

      });

      describe('comparators', function() {

        // Insert a unique record to test with
        before(function(done) {
          var query = [
            'INSERT INTO "test_find" (field_1, field_2)',
            "values ('foobar', 'AR)H$daxx');"
          ].join('');

          support.Client(function(err, client, close) {
            client.query(query, function() {

              // close client
              close();

              done();
            });
          });
        });

        it('should support endsWith', function(done) {

          var criteria = {
            where: {
              field_2: {
                endsWith: 'AR)H$daxx'
              }
            }
          };

          adapter.find('test', 'test_find', criteria, function(err, results) {
            results.length.should.eql(1);
            results[0].field_2.should.eql('AR)H$daxx');
            done();
          });
        });

      });

    });

  });
});
