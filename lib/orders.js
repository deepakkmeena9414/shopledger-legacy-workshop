var dates = require('./dates');
var inventory = require('./inventory');
var ledger = require('./ledger');

exports.add = function (db, orderData) {
  var order = {
    id: db.nextOrderId++,
    date: orderData.date || dates.today(),
    customer: orderData.customer || 'Walk-in',
    customerId: orderData.customerId || null,
    paymentMode: orderData.paymentMode || 'cash',
    status: orderData.status || 'completed',
    items: orderData.items || [],
    coupon: orderData.coupon || '',
    subtotal: orderData.subtotal,
    discount: orderData.discount,
    tax: orderData.tax,
    total: orderData.total
  };

  db.orders.push(order);
  return order;
};

exports.get = function (db, id) {
  for (var i = 0; i < db.orders.length; i++) {
    if (db.orders[i].id == id) return db.orders[i];
  }
  return null;
};

function dateKey(date) {
  var parts = dates.normalizeDateKey(date).split('/');
  var day;
  var month;
  var year;

  if (parts.length !== 3) return null;

  day = Number(parts[0]);
  month = Number(parts[1]);
  year = Number(parts[2]);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;

  var parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }

  return year * 10000 + month * 100 + day;
}

// Added Aug 2021 (Rohit): cancel an order and release its inventory
exports.cancel = function (db, id, reason) {
  var order = exports.get(db, id);
  if (!order) return { ok: false, error: 'Order not found' };
  if (order.status === 'cancelled') {
    return { ok: false, error: 'Order #' + order.id + ' is already cancelled' };
  }

  order.status = 'cancelled';
  order.cancelledAt = dates.today();
  order.cancelReason = reason || 'Cancelled by operator';

  // Return items to stock
  inventory.release(db.products, order.items);

  // If billed to customer khata, reverse the debit on their credit account
  if (order.paymentMode === 'khata' && order.customerId) {
    ledger.reverseOrderDebit(db, order.customerId, order.total);
  }

  return { ok: true, order: order };
};

// Lists orders with optional search, status, and date range filters (newest first)
exports.list = function (db, filters) {
  var opts = filters || {};
  var list = db.orders.slice();

  if (opts.status && opts.status !== 'all') {
    list = list.filter(function (o) {
      return (o.status || 'completed') === opts.status;
    });
  }

  if (opts.search) {
    var q = String(opts.search).toLowerCase().trim();
    list = list.filter(function (o) {
      var idMatch = String(o.id).indexOf(q) !== -1;
      var custMatch = String(o.customer || 'Walk-in').toLowerCase().indexOf(q) !== -1;
      var couponMatch = String(o.coupon || '').toLowerCase().indexOf(q) !== -1;
      return idMatch || custMatch || couponMatch;
    });
  }

  if (opts.from) {
    var fromKey = dateKey(opts.from);
    if (fromKey !== null) {
      list = list.filter(function (o) {
        var orderDate = dateKey(o.date);
        return orderDate !== null && orderDate >= fromKey;
      });
    }
  }

  if (opts.to) {
    var toKey = dateKey(opts.to);
    if (toKey !== null) {
      list = list.filter(function (o) {
        var orderDate = dateKey(o.date);
        return orderDate !== null && orderDate <= toKey;
      });
    }
  }

  // newest first
  return list.sort(function (a, b) {
    var aDate = dateKey(a.date);
    var bDate = dateKey(b.date);

    if (aDate === null && bDate === null) return Number(b.id) - Number(a.id);
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    if (aDate === bDate) return Number(b.id) - Number(a.id);
    return bDate - aDate;
  });
};
