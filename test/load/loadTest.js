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

var Adapter = require('../../lib/adapter'),
    Config = require('./support/config'),
    Fixture = require('./support/fixture'),
    assert = require('assert'),
    async = require('async');

var CONNECTIONS = 10000;

describe('Load Testing', function() {
  this.timeout(60000);

  before(function(done) {
    var Schema;

    // Register The Collection
    Adapter.registerCollection({ identity: 'loadTest', config: Config }, function(err) {
      if(err) done(err);

      // Define The Collection
      Adapter.define('loadTest', Fixture, function(err, schema) {
        if(err) return done(err);
        Schema = schema;
        done();
      });
    });
  });

  describe('create with x connection', function() {

    it('should not error', function(done) {

      // generate x users
      async.times(CONNECTIONS, function(n, next){

        var data = {
          first_name: Math.floor((Math.random()*100000)+1),
          last_name: Math.floor((Math.random()*100000)+1),
          email: Math.floor((Math.random()*100000)+1)
        };

        Adapter.create('loadTest', data, next);
      }, function(err, users) {
        assert(!err);
        assert(users.length === CONNECTIONS);
        done();
      });
    });
  });

});
