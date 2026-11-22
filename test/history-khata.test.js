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

test('lists orders newest first by calendar date', function () {
  var result = orders.list(makeOrders(), {});

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('filters orders inclusively within an ISO date range', function () {
  var result = orders.list(makeOrders(), {
    from: '2022-02-01',
    to: '2022-03-31'
  });

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008]);
});

test('records a string settlement amount as currency', function () {
  var db = makeKhata();
  var result = ledger.recordSettlement(db, 1, '500', 'upi', 'Part payment');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('uses the rounded currency amount for the settlement receipt and ledger', function () {
  var db = makeKhata();
  var result = ledger.recordSettlement(db, 1, '500.009', 'upi', 'Part payment');

  assert.equal(result.ok, true);
  assert.equal(result.settlement.amount, 500.01);
  assert.equal(result.customer.totalSettled, 1700.01);
  assert.equal(result.customer.balance, 732);
});

test('rejects a settlement that rounds to zero paise', function () {
  var db = makeKhata();
  var result = ledger.recordSettlement(db, 1, '0.004', 'upi', 'Part payment');

  assert.equal(result.ok, false);
  assert.equal(result.error, 'Settlement amount must be greater than zero');
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.settlements.length, 0);
});
