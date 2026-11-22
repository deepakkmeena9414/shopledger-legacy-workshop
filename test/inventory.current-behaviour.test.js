var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');

test('check allows an order for exactly the remaining sellable stock', function () {
  var products = [{
    id: 1,
    name: 'A2 Gir Cow Ghee 500ml',
    stock: 1,
    reserved: 0
  }];

  var result = inventory.check(products, [{ id: 1, qty: 1 }]);

  assert.deepEqual(result, { ok: true });
});

test('release restores physical stock from an order line', function () {
  var products = [{
    id: 2,
    stock: 4,
    reserved: 3
  }];

  inventory.release(products, [{ id: 2, qty: 1 }]);

  assert.deepEqual(products[0], { id: 2, stock: 5, reserved: 3 });
});
