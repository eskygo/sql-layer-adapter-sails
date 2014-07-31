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

var adapter = require('../../lib/adapter'),
    should = require('should'),
    support = require('./support/bootstrap');

describe('adapter', function() {

  /**
   * Teardown
   */

  before(function(done) {
    support.registerConnection(['test_index'], done);
  });

  after(function(done) {
    support.Teardown('test_index', done);
  });

  // Attributes for the test table
  var definition = {
    id: {
      type: 'serial',
      autoIncrement: true
    },
    name: {
      type: 'string',
      index: true
    }
  };

  /**
   * Indexes
   *
   * Ensure Indexes get created correctly
   */

  describe('Index Attributes', function() {

    // Build Indicies from definition
    it('should add indicies', function(done) {

      adapter.define('test', 'test_index', definition, function(err) {
        adapter.describe('test', 'test_index', function(err, result) {
          result.name.indexed.should.eql(true);
          done();
        });
      });

    });

  });
});
