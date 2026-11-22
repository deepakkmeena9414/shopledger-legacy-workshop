var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('check allows buying the exact remaining sellable stock', function () {
  var products = [
    { id: 6, name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
    { id: 11, name: 'Byadgi Kashmiri Chilli Powder 500g', stock: 4, reserved: 3 }
  ];

  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), { ok: true });
  assert.deepEqual(inventory.check(products, [{ id: 11, qty: 1 }]), { ok: true });
});

test('cancelling an order restores committed quantities to physical stock', function () {
  var db = {
    products: [
      { id: 4, stock: 22, reserved: 4 },
      { id: 6, stock: 1, reserved: 0 }
    ],
    orders: [{
      id: 1007,
      status: 'pending',
      paymentMode: 'cash',
      items: [
        { id: 6, qty: 2 },
        { id: 4, qty: 2 }
      ]
    }]
  };

  var result = orders.cancel(db, 1007, 'Customer cancelled');

  assert.equal(result.ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.deepEqual(db.products, [
    { id: 4, stock: 24, reserved: 4 },
    { id: 6, stock: 3, reserved: 0 }
  ]);
});
