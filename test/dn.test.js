// Copyright 2011 Mark Cavage, Inc.  All rights reserved.

var test = require('tape').test;



///--- Globals

var dn;



///--- Tests

test('load library', function (t) {
  dn = require('../lib/index').dn;
  t.ok(dn);
  t.end();
});


test('parse basic', function (t) {
  var DN_STR = 'cn=mark, ou=people, o=joyent';
  var name = dn.parse(DN_STR);
  t.ok(name);
  t.ok(name.rdns);
  t.ok(Array.isArray(name.rdns));
  t.equal(3, name.rdns.length);
  name.rdns.forEach(function (rdn) {
    t.equal('object', typeof (rdn));
  });
  t.equal(name.toString(), DN_STR);
  t.end();
});


test('parse escaped', function (t) {
  var DN_STR = 'cn=m\\,ark, ou=people, o=joyent';
  var name = dn.parse(DN_STR);
  t.ok(name);
  t.ok(name.rdns);
  t.ok(Array.isArray(name.rdns));
  t.equal(3, name.rdns.length);
  name.rdns.forEach(function (rdn) {
    t.equal('object', typeof (rdn));
  });
  t.equal(name.toString(), DN_STR);
  t.end();
});


test('parse compound', function (t) {
  var DN_STR = 'cn=mark+sn=cavage, ou=people, o=joyent';
  var name = dn.parse(DN_STR);
  t.ok(name);
  t.ok(name.rdns);
  t.ok(Array.isArray(name.rdns));
  t.equal(3, name.rdns.length);
  name.rdns.forEach(function (rdn) {
    t.equal('object', typeof (rdn));
  });
  t.equal(name.toString(), DN_STR);
  t.end();
});


test('parse quoted', function (t) {
  var DN_STR = 'cn="mark+sn=cavage", ou=people, o=joyent';
  var ESCAPE_STR = 'cn=mark\\+sn\\=cavage, ou=people, o=joyent';
  var name = dn.parse(DN_STR);
  t.ok(name);
  t.ok(name.rdns);
  t.ok(Array.isArray(name.rdns));
  t.equal(3, name.rdns.length);
  name.rdns.forEach(function (rdn) {
    t.equal('object', typeof (rdn));
  });
  t.equal(name.toString(), ESCAPE_STR);
  t.end();
});


test('equals', function (t) {
  var dn1 = dn.parse('cn=foo,dc=bar');
  t.ok(dn1.equals('cn=foo,dc=bar'));
  t.ok(!dn1.equals('cn=foo1,dc=bar'));
  t.ok(dn1.equals(dn.parse('cn=foo,dc=bar')));
  t.ok(!dn1.equals(dn.parse('cn=foo2,dc=bar')));
  t.end();
});


test('child of', function (t) {
  var dn1 = dn.parse('cn=foo,dc=bar');
  t.ok(dn1.childOf('dc=bar'));
  t.ok(!dn1.childOf('dc=moo'));
  t.ok(!dn1.childOf('dc=foo'));
  t.ok(!dn1.childOf('cn=foo,dc=bar'));

  t.ok(dn1.childOf(dn.parse('dc=bar')));
  t.end();
});


test('parent of', function (t) {
  var dn1 = dn.parse('cn=foo,dc=bar');
  t.ok(dn1.parentOf('cn=moo,cn=foo,dc=bar'));
  t.ok(!dn1.parentOf('cn=moo,cn=bar,dc=foo'));
  t.ok(!dn1.parentOf('cn=foo,dc=bar'));

  t.ok(dn1.parentOf(dn.parse('cn=moo,cn=foo,dc=bar')));
  t.end();
});


test('DN parent', function (t) {
  var _dn = dn.parse('cn=foo,ou=bar');
  var parent1 = _dn.parent();
  var parent2 = parent1.parent();
  t.ok(parent1.equals('ou=bar'));
  t.ok(parent2.equals(''));
  t.equal(parent2.parent(), null);
  t.end();
});


test('empty DNs', function (t) {
  var _dn = dn.parse('');
  var _dn2 = dn.parse('cn=foo');
  t.ok(_dn.isEmpty());
  t.notOk(_dn2.isEmpty());
  t.notOk(_dn.equals('cn=foo'));
  t.notOk(_dn2.equals(''));
  t.ok(_dn.parentOf('cn=foo'));
  t.notOk(_dn.childOf('cn=foo'));
  t.notOk(_dn2.parentOf(''));
  t.ok(_dn2.childOf(''));
  t.end();
});


test('case insensitive attribute names', function (t) {
  var dn1 = dn.parse('CN=foo,dc=bar');
  t.ok(dn1.equals('cn=foo,dc=bar'));
  t.ok(dn1.equals(dn.parse('cn=foo,DC=bar')));
  t.end();
});


test('format', function (t) {
  var DN_ORDER = dn.parse('sn=bar+cn=foo,ou=test');
  var DN_QUOTE = dn.parse('cn="foo",ou=test');
  var DN_QUOTE2 = dn.parse('cn=" foo",ou=test');
  var DN_SPACE = dn.parse('cn=foo,ou=test');
  var DN_SPACE2 = dn.parse('cn=foo ,ou=test');
  var DN_CASE = dn.parse('CN=foo,Ou=test');

  t.equal(DN_ORDER.format({keepOrder: false}), 'cn=foo+sn=bar, ou=test');
  t.equal(DN_ORDER.format({keepOrder: true}), 'sn=bar+cn=foo, ou=test');

  t.equal(DN_QUOTE.format({keepQuote: false}), 'cn=foo, ou=test');
  t.equal(DN_QUOTE.format({keepQuote: true}), 'cn="foo", ou=test');
  t.equal(DN_QUOTE2.format({keepQuote: false}), 'cn=" foo", ou=test');
  t.equal(DN_QUOTE2.format({keepQuote: true}), 'cn=" foo", ou=test');

  t.equal(DN_SPACE.format({keepSpace: false}), 'cn=foo, ou=test');
  t.equal(DN_SPACE.format({keepSpace: true}), 'cn=foo,ou=test');
  t.equal(DN_SPACE.format({skipSpace: true}), 'cn=foo,ou=test');
  t.equal(DN_SPACE2.format({keepSpace: false}), 'cn=foo, ou=test');
  t.equal(DN_SPACE2.format({keepSpace: true}), 'cn=foo ,ou=test');
  t.equal(DN_SPACE2.format({skipSpace: true}), 'cn=foo,ou=test');

  t.equal(DN_CASE.format({keepCase: false}), 'cn=foo, ou=test');
  t.equal(DN_CASE.format({keepCase: true}), 'CN=foo, Ou=test');
  t.equal(DN_CASE.format({upperName: true}), 'CN=foo, OU=test');
  t.end();
});


test('set format', function (t) {
  var _dn = dn.parse('uid="user",  sn=bar+cn=foo, dc=test , DC=com');
  t.equal(_dn.toString(), 'uid=user, cn=foo+sn=bar, dc=test, dc=com');
  _dn.setFormat({keepOrder: true});
  t.equal(_dn.toString(), 'uid=user, sn=bar+cn=foo, dc=test, dc=com');
  _dn.setFormat({keepQuote: true});
  t.equal(_dn.toString(), 'uid="user", cn=foo+sn=bar, dc=test, dc=com');
  _dn.setFormat({keepSpace: true});
  t.equal(_dn.toString(), 'uid=user,  cn=foo+sn=bar, dc=test , dc=com');
  _dn.setFormat({keepCase: true});
  t.equal(_dn.toString(), 'uid=user, cn=foo+sn=bar, dc=test, DC=com');
  _dn.setFormat({upperName: true});
  t.equal(_dn.toString(), 'UID=user, CN=foo+SN=bar, DC=test, DC=com');
  t.end();
});


test('format persists across clone', function (t) {
  var _dn = dn.parse('uid="user",  sn=bar+cn=foo, dc=test , DC=com');
  var OUT = 'UID="user", CN=foo+SN=bar, DC=test, DC=com';
  _dn.setFormat({keepQuote: true, upperName: true});
  var clone = _dn.clone();
  t.equals(_dn.toString(), OUT);
  t.equals(clone.toString(), OUT);
  t.end();
});


test('isDN duck-testing', function (t) {
  var valid = dn.parse('cn=foo');
  var isDN = dn.DN.isDN;
  t.notOk(isDN(null));
  t.notOk(isDN('cn=foo'));
  t.ok(isDN(valid));
  var duck = {
    rdns: [ {look: 'ma'}, {a: 'dn'} ],
    toString: function () { return 'look=ma, a=dn'; }
  };
  t.ok(isDN(duck));
  t.end();
});
