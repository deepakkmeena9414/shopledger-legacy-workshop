'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

function bill(items, coupon) {
  var totals = pricing.computeTotals(items, coupon);

  return {
    items: items,
    coupon: coupon,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
}

test('invoice uses the billed HSN GST slab', function () {
  var order = bill([{
    id: 1,
    name: 'Rice',
    sku: 'RICE-1KG',
    hsn: '1006',
    price: 100,
    qty: 1
  }], '');

  assert.deepStrictEqual({
    tax: order.tax,
    cgst: pricing.computeTotals(order.items, order.coupon).cgst,
    sgst: pricing.computeTotals(order.items, order.coupon).sgst,
    total: order.total
  }, {
    tax: 5,
    cgst: 2.5,
    sgst: 2.5,
    total: 105
  });

  assert.deepStrictEqual(invoice.computeInvoiceFigures(order), {
    subtotal: 100,
    discount: 0,
    tax: 5,
    cgst: 2.5,
    sgst: 2.5,
    total: 105,
    rows: [{
      name: 'Rice',
      sku: 'RICE-1KG',
      hsn: '1006',
      qty: 1,
      price: 100,
      gstPercent: 5,
      line: 100,
      lineTax: 5
    }]
  });
});

test('invoice applies a flat coupon before calculating GST', function () {
  var order = bill([{
    id: 2,
    name: 'Packaged tea',
    sku: 'TEA-1KG',
    hsn: '0902',
    gstRate: 18,
    price: 1000,
    qty: 1
  }], 'FLAT50');
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual({
    discount: order.discount,
    tax: order.tax,
    total: order.total
  }, {
    discount: 50,
    tax: 171,
    total: 1121
  });

  assert.deepStrictEqual({
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  }, {
    discount: 50,
    tax: 171,
    cgst: 85.5,
    sgst: 85.5,
    total: 1121
  });
});

test('invoice applies percentage coupons and GST exactly as checkout does', function () {
  var order = bill([{
    id: 3,
    name: 'Packaged tea',
    sku: 'TEA-1KG',
    hsn: '0902',
    gstRate: 18,
    price: 1000,
    qty: 1
  }], 'SAVE10');
  var figures = invoice.computeInvoiceFigures(order);

  assert.deepStrictEqual({
    discount: order.discount,
    tax: order.tax,
    cgst: pricing.computeTotals(order.items, order.coupon).cgst,
    sgst: pricing.computeTotals(order.items, order.coupon).sgst,
    total: order.total
  }, {
    discount: 100,
    tax: 162,
    cgst: 81,
    sgst: 81,
    total: 1062
  });

  assert.deepStrictEqual({
    discount: figures.discount,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    total: figures.total
  }, {
    discount: 100,
    tax: 162,
    cgst: 81,
    sgst: 81,
    total: 1062
  });
});

test('rendered invoice presents the billed figures without a reconciliation notice', function () {
  var order = bill([{
    id: 4,
    name: 'Rice',
    sku: 'RICE-1KG',
    hsn: '1006',
    price: 100,
    qty: 1
  }], '');
  order.id = 44;
  order.date = '2026-11-22';

  var html = invoice.render(order);

  assert.match(html, /GST Amt<\/th>/);
  assert.match(html, /<td class="r">5%<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹105\.00<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
