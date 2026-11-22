'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');

test('invoice figures exactly match the recorded checkout bill for affected orders', function () {
  [{
    id: 1001,
    items: [
      { name: 'Assam CTC Masala Chai 250g', hsn: '0902', price: 140, qty: 2 },
      { name: 'Unpolished Toor Dal 1kg', hsn: '0713', price: 165, qty: 2 }
    ],
    coupon: '',
    expected: { discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 }
  }, {
    id: 1002,
    items: [
      { name: 'Indrayani Basmati Rice 5kg', hsn: '1006', price: 640, qty: 1 },
      { name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', price: 190, qty: 2 }
    ],
    coupon: 'SAVE10',
    expected: { discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 }
  }, {
    id: 1004,
    items: [
      { name: 'Cold-Pressed Groundnut Oil 5L', hsn: '1508', price: 1120, qty: 2 }
    ],
    coupon: 'SAVE10',
    expected: { discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 }
  }, {
    id: 1007,
    items: [
      { name: 'A2 Gir Cow Ghee 500ml', hsn: '0405', price: 450, qty: 2 },
      { name: 'Cold-Pressed Sunflower Oil 1L', hsn: '1512', price: 190, qty: 2 }
    ],
    coupon: '',
    expected: { discount: 0, tax: 127, cgst: 63.5, sgst: 63.5, total: 1407 }
  }].forEach(function (order) {
    var figures = invoice.computeInvoiceFigures(order);

    assert.deepStrictEqual({
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    }, order.expected, 'order #' + order.id);
  });
});
