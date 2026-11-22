var test = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

function makeOrders() {
  return {
    orders: [
      { id: 1001, date: '28/12/2021', customer: 'Meera Joshi' },
      { id: 1004, date: '30/01/2022', customer: 'Kalyani Foods' },
      { id: 1008, date: '15/03/2022', customer: 'Walk-in' }
    ]
  };
}

function makeKhata() {
  return {
    nextSettlementId: 505,
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: []
  };
}

test('orders sort by calendar date instead of DD/MM/YYYY text', function () {
  var result = orders.list(makeOrders(), {});

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('ISO date filters compare calendar dates', function () {
  var result = orders.list(makeOrders(), {
    from: '2022-02-01',
    to: '2022-03-31'
  });

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008]);
});

test('string settlement amount is converted before updating the ledger', function () {
  var db = makeKhata();
  var result = ledger.recordSettlement(db, 1, '500', 'upi', 'Part payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
});
