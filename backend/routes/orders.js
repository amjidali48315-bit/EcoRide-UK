const router  = require('express').Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Driver  = require('../models/Driver');
const { requireAdmin } = require('../middleware/authMiddleware');
const crypto  = require('crypto');

const POSTCODE_CITY = {
  'E':'London','EC':'London','N':'London','NW':'London','SE':'London',
  'SW':'London','W':'London','WC':'London','BR':'London','CR':'London',
  'DA':'London','EN':'London','HA':'London','IG':'London','KT':'London',
  'RM':'London','SM':'London','TW':'London','UB':'London','WD':'London',
  'B':'Birmingham','CV':'Coventry','WS':'Walsall','WV':'Wolverhampton','DY':'Dudley',
  'M':'Manchester','SK':'Stockport','OL':'Oldham','BL':'Bolton','WN':'Wigan','WA':'Warrington',
  'LS':'Leeds','BD':'Bradford','HX':'Halifax','HD':'Huddersfield','WF':'Wakefield',
  'S':'Sheffield','DN':'Doncaster',
  'L':'Liverpool','CH':'Chester','PR':'Preston',
  'BS':'Bristol','BA':'Bath',
  'NE':'Newcastle','SR':'Sunderland','DH':'Durham',
  'NG':'Nottingham','DE':'Derby','LE':'Leicester',
  'EH':'Edinburgh','FK':'Falkirk','KY':'Kirkcaldy',
  'G':'Glasgow','PA':'Paisley','ML':'Motherwell','KA':'Kilmarnock',
  'CF':'Cardiff','NP':'Newport','SA':'Swansea',
  'BT':'Belfast',
  'SO':'Southampton','PO':'Portsmouth',
  'OX':'Oxford','CB':'Cambridge',
  'BN':'Brighton','TN':'Tunbridge Wells',
  'RG':'Reading','SL':'Slough',
  'LU':'Luton','AL':'St Albans','HP':'Hemel Hempstead','MK':'Milton Keynes',
  'PL':'Plymouth','EX':'Exeter','TQ':'Torquay',
  'ST':'Stoke-on-Trent','TF':'Telford',
  'HU':'Hull','YO':'York','HG':'Harrogate',
  'GL':'Gloucester','SN':'Swindon','RH':'Redhill','GU':'Guildford',
  'CT':'Canterbury','ME':'Maidstone','SS':'Southend','CM':'Chelmsford',
  'CO':'Colchester','IP':'Ipswich','NR':'Norwich','PE':'Peterborough',
  'NN':'Northampton','SG':'Stevenage',
  'TS':'Middlesbrough','DL':'Darlington','LA':'Lancaster','FY':'Blackpool',
  'BB':'Blackburn',
  'AB':'Aberdeen','DD':'Dundee','PH':'Perth','IV':'Inverness',
  'LL':'Llandudno','SY':'Shrewsbury','HR':'Hereford','WR':'Worcester',
};

function detectCity(postcode) {
  const area = (postcode || '').trim().toUpperCase().replace(/\s+/g, '').match(/^[A-Z]+/)?.[0] || '';
  return POSTCODE_CITY[area] || area || '';
}

const AREA_COORDS = {
  'E':{'lat':51.52,'lng':-0.04},'EC':{'lat':51.52,'lng':-0.09},
  'N':{'lat':51.56,'lng':-0.11},'NW':{'lat':51.55,'lng':-0.17},
  'SE':{'lat':51.47,'lng':-0.04},'SW':{'lat':51.47,'lng':-0.17},
  'W':{'lat':51.51,'lng':-0.21},'WC':{'lat':51.52,'lng':-0.12},
  'BR':{'lat':51.41,'lng':0.01},'CR':{'lat':51.37,'lng':-0.10},
  'DA':{'lat':51.45,'lng':0.22},'EN':{'lat':51.65,'lng':-0.08},
  'HA':{'lat':51.58,'lng':-0.33},'IG':{'lat':51.56,'lng':0.08},
  'KT':{'lat':51.41,'lng':-0.30},'RM':{'lat':51.57,'lng':0.18},
  'SM':{'lat':51.38,'lng':-0.19},'TW':{'lat':51.45,'lng':-0.33},
  'UB':{'lat':51.53,'lng':-0.48},'WD':{'lat':51.66,'lng':-0.41},
  'B':{'lat':52.48,'lng':-1.89},'CV':{'lat':52.41,'lng':-1.51},
  'WS':{'lat':52.58,'lng':-1.98},'WV':{'lat':52.59,'lng':-2.13},
  'DY':{'lat':52.51,'lng':-2.08},'LS':{'lat':53.80,'lng':-1.55},
  'S':{'lat':53.38,'lng':-1.47},'M':{'lat':53.48,'lng':-2.24},
  'L':{'lat':53.41,'lng':-2.98},'BS':{'lat':51.45,'lng':-2.59},
  'EH':{'lat':55.95,'lng':-3.19},'G':{'lat':55.86,'lng':-4.25},
  'CF':{'lat':51.48,'lng':-3.18},'BN':{'lat':50.82,'lng':-0.14},
  'OX':{'lat':51.75,'lng':-1.26},'CB':{'lat':52.20,'lng':0.12},
  'NG':{'lat':52.95,'lng':-1.14},'LE':{'lat':52.64,'lng':-1.13},
  'NE':{'lat':54.97,'lng':-1.61},'SR':{'lat':54.91,'lng':-1.38},
  'TS':{'lat':54.57,'lng':-1.23},'HU':{'lat':53.74,'lng':-0.33},
  'YO':{'lat':53.96,'lng':-1.09},'BD':{'lat':53.79,'lng':-1.76},
  'SK':{'lat':53.41,'lng':-2.16},'ST':{'lat':52.99,'lng':-2.19},
  'MK':{'lat':52.04,'lng':-0.76},'RG':{'lat':51.46,'lng':-0.97},
  'GU':{'lat':51.24,'lng':-0.57},'PO':{'lat':50.82,'lng':-1.07},
  'SO':{'lat':50.91,'lng':-1.40},'GL':{'lat':51.87,'lng':-2.24},
  'SN':{'lat':51.56,'lng':-1.78},'EX':{'lat':50.72,'lng':-3.53},
  'PL':{'lat':50.38,'lng':-4.14},'CT':{'lat':51.28,'lng':1.08},
  'TN':{'lat':51.01,'lng':0.26},'ME':{'lat':51.42,'lng':0.52},
  'SS':{'lat':51.54,'lng':0.72},'CM':{'lat':51.74,'lng':0.47},
  'CO':{'lat':51.90,'lng':0.90},'IP':{'lat':52.06,'lng':1.16},
  'NR':{'lat':52.63,'lng':1.30},'LU':{'lat':51.88,'lng':-0.42},
  'AL':{'lat':51.75,'lng':-0.33},'HP':{'lat':51.74,'lng':-0.75},
  'SL':{'lat':51.51,'lng':-0.60},'RH':{'lat':51.23,'lng':-0.18},
};

function postcodeToCoords(postcode) {
  const area = (postcode || '').trim().toUpperCase().replace(/\s+/g,'').match(/^[A-Z]+/)?.[0] || '';
  return AREA_COORDS[area] || null;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const https = require('https');

function bulkPostcodeCoords(postcodes) {
  return new Promise((resolve) => {
    const unique = [...new Set(
      postcodes.filter(Boolean).map(p => p.trim().toUpperCase())
    )].slice(0, 100);
    if (unique.length === 0) return resolve({});

    const body = JSON.stringify({ postcodes: unique });
    const opts = {
      hostname: 'api.postcodes.io',
      path:     '/postcodes',
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const map = {};
          const json = JSON.parse(data);
          (json.result || []).forEach(item => {
            if (item.result) {
              const key = (item.query || '').replace(/\s+/g,'').toUpperCase();
              map[key] = { lat: item.result.latitude, lng: item.result.longitude };
            }
          });
          resolve(map);
        } catch { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.write(body);
    req.end();
  });
}

function getStock(product) {
  const byCity = (product.stock_by_city && typeof product.stock_by_city === 'object')
    ? product.stock_by_city : {};
  const cityTotal   = Object.values(byCity).reduce((s, v) => s + (Number(v) || 0), 0);
  const legacyTotal = (Number(product.stock_london) || 0) + (Number(product.stock_birmingham) || 0);
  const total       = cityTotal || legacyTotal || (Number(product.stock) || 0);
  return { byCity, cityTotal, legacyTotal, total };
}

function validPhone(phone) {
  const digits = (phone || '').replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function validPostcode(postcode) {
  const clean = (postcode || '').trim().replace(/\s+/g, '');
  return clean.length >= 3 && /[A-Z]/i.test(clean) && /\d/.test(clean);
}

router.post('/', async (req, res) => {
  try {
    const {
      full_name, phone, address, postcode,
      product_id, quantity, customer_id,
      city: cityInput,
    } = req.body;

    const errors = [];
    if (!full_name?.trim())              errors.push('Full name is required.');
    if (!phone?.trim())                  errors.push('Phone number is required.');
    else if (!validPhone(phone))         errors.push('Please enter a valid phone number.');
    if (!postcode?.trim())               errors.push('Postcode is required.');
    else if (!validPostcode(postcode))   errors.push('Please enter a valid postcode (e.g. SW1A 1AA).');
    if (!address?.trim())                errors.push('Delivery address is required.');
    if (!product_id)                     errors.push('Product not specified.');
    if (errors.length)                   return res.status(400).json({ errors });

    const qty  = Math.max(1, parseInt(quantity) || 1);
    const city = cityInput?.trim() || detectCity(postcode) || '';

    const product = await Product.findOne({ _id: product_id, is_active: true });
    if (!product) return res.status(404).json({ errors: ['Product not found or no longer available.'] });

    const stockInfo = getStock(product);
    if (stockInfo.total <= 0)          return res.status(400).json({ errors: ['This product is currently out of stock.'] });
    if (qty > stockInfo.total)         return res.status(400).json({ errors: [`Only ${stockInfo.total} unit(s) in stock.`] });

    let stock_source = 'Default';
    if (stockInfo.cityTotal > 0) {
      const byCity = { ...stockInfo.byCity };
      let deducted = false;
      for (const [c, amount] of Object.entries(byCity)) {
        if ((Number(amount) || 0) >= qty) {
          byCity[c] = (Number(amount) || 0) - qty;
          product.stock_by_city = byCity;
          product.stock = Object.values(byCity).reduce((s, v) => s + (Number(v) || 0), 0);
          stock_source = c;
          deducted = true;
          break;
        }
      }
      if (!deducted) {
        product.stock = Math.max(0, stockInfo.total - qty);
        stock_source  = 'Shared';
      }
    } else if (stockInfo.legacyTotal > 0) {
      if (city === 'Birmingham' && (product.stock_birmingham || 0) >= qty) {
        product.stock_birmingham -= qty;
        stock_source = 'Birmingham';
      } else if ((product.stock_london || 0) >= qty) {
        product.stock_london -= qty;
        stock_source = 'London';
      } else {
        product.stock_birmingham -= qty;
        stock_source = 'Birmingham';
      }
      product.stock = (product.stock_london || 0) + (product.stock_birmingham || 0);
    } else {
      product.stock = Math.max(0, (product.stock || 0) - qty);
    }
    await product.save();

    const order_ref  = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const total      = Number(product.price) * qty;
    const cost_price = Number(product.cost_price || 0) * qty;

    const order = await Order.create({
      order_ref,
      customer_id:    customer_id || null,
      customer_name:  full_name.trim(),
      phone:          phone.trim(),
      address:        address.trim(),
      postcode:       postcode.toUpperCase().trim(),
      city,
      product_id:     product._id,
      product_name:   product.name,
      quantity:       qty,
      total_amount:   total,
      cost_price,
      profit:         total - cost_price,
      status:         'Pending',
      payment_method: 'Cash on Delivery',
      stock_source,
    });

    res.status(201).json({ success: true, order_ref, order });
  } catch (err) {
    console.error('POST /orders error:', err.message);
    res.status(500).json({ errors: ['Server error: ' + err.message] });
  }
});

router.get('/', async (req, res) => {
  try {
    const { ref } = req.query;
    if (!ref) return res.json([]);
    const orders = await Order.find({ order_ref: ref.toUpperCase().trim() })
      .populate('assigned_driver', 'name phone');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
    if (req.query.city   && req.query.city   !== 'All') filter.city   = req.query.city;
    const orders = await Order.find(filter)
      .populate('assigned_driver', 'name phone city')
      .sort({ created_at: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/distance', requireAdmin, async (req, res) => {
  try {
    const { postcode } = req.query;
    if (!postcode) return res.status(400).json({ error: 'Postcode required.' });

    const drivers = await Driver.find({ is_active: true }).select('-password');

    const allPostcodes = [
      postcode,
      ...drivers.filter(d => d.postcode).map(d => d.postcode),
    ];

    const liveCoords = await bulkPostcodeCoords(allPostcodes);

    const resolve = (pc) => {
      if (!pc) return null;
      const key = pc.replace(/\s+/g, '').toUpperCase();
      if (liveCoords[key]) return liveCoords[key];
      return postcodeToCoords(pc);
    };

    const custCoords = resolve(postcode);
    if (!custCoords) {
      return res.status(400).json({ error: `Could not resolve coordinates for postcode: ${postcode}` });
    }

    const result = drivers.map(d => {
      const obj = d.toObject();
      if (d.postcode) {
        const dc = resolve(d.postcode);
        obj.distance_miles = dc
          ? parseFloat(haversineDistance(custCoords.lat, custCoords.lng, dc.lat, dc.lng).toFixed(1))
          : null;
        obj.coords_source = dc
          ? (liveCoords[d.postcode.replace(/\s+/g,'').toUpperCase()] ? 'live' : 'approx')
          : 'unknown';
      } else {
        obj.distance_miles = null;
        obj.coords_source  = 'none';
      }
      return obj;
    });

    result.sort((a, b) => (a.distance_miles ?? 9999) - (b.distance_miles ?? 9999));

    res.json({
      customer_postcode: postcode,
      coords_source: liveCoords[postcode.replace(/\s+/g,'').toUpperCase()] ? 'live' : 'approx',
      drivers: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/assign', requireAdmin, async (req, res) => {
  try {
    const { driver_id, distance_miles, admin_notes, stock_source, partner_name } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const driver = driver_id ? await Driver.findById(driver_id) : null;
    const dist   = parseFloat(distance_miles) || 0;

    order.assigned_driver = driver_id || null;
    order.distance_miles  = dist;
    order.driver_payment  = driver ? parseFloat((driver.payment_per_mile * dist).toFixed(2)) : 0;
    if (stock_source  !== undefined) order.stock_source  = stock_source;
    if (partner_name  !== undefined) order.partner_name  = partner_name;
    if (admin_notes   !== undefined) order.admin_notes   = admin_notes;
    // Only set Assigned when a driver is picked, otherwise keep Pending
    if (driver_id) order.status = 'Assigned';
    // profit is recalculated by the pre-save hook using the values set above
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/cost', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    order.cost_price = parseFloat(req.body.cost_price) || 0;
    order.profit     = order.total_amount - order.cost_price - order.driver_payment;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/partner', requireAdmin, async (req, res) => {
  try {
    const { partner_name, partner_whatsapp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.is_partner_order) return res.status(400).json({ error: 'Already a partner order.' });

    if (order.product_id && order.quantity > 0) {
      const product = await Product.findById(order.product_id);
      if (product) {
        const src    = order.stock_source || '';
        const byCity = (product.stock_by_city && typeof product.stock_by_city === 'object')
          ? { ...product.stock_by_city } : {};
        if (src && byCity[src] !== undefined) {
          byCity[src] = (Number(byCity[src]) || 0) + order.quantity;
          product.stock_by_city = byCity;
          product.stock = Object.values(byCity).reduce((s, v) => s + (Number(v) || 0), 0);
        } else if (product.stock_london !== undefined && src === 'London') {
          product.stock_london = (product.stock_london || 0) + order.quantity;
          product.stock = (product.stock_london || 0) + (product.stock_birmingham || 0);
        } else if (product.stock_birmingham !== undefined && src === 'Birmingham') {
          product.stock_birmingham = (product.stock_birmingham || 0) + order.quantity;
          product.stock = (product.stock_london || 0) + (product.stock_birmingham || 0);
        } else {
          product.stock = (product.stock || 0) + order.quantity;
        }
        await product.save();
      }
    }

    order.is_partner_order = true;
    order.partner_name     = partner_name     || '';
    order.partner_whatsapp = partner_whatsapp || '';
    order.status           = 'Partner';
    order.profit           = 0;
    order.cost_price       = 0;
    order.stock_source     = 'Partner';
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/partner-status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Delivered', 'Cancelled'].includes(status))
      return res.status(400).json({ error: 'Status must be Delivered or Cancelled.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    order.status = status;
    order.profit = 0;
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;