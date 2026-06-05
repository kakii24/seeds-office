'use strict';

const Database = require('better-sqlite3');

/**
 * better-sqlite3 data layer for the Seeds Office app.
 * Synchronous API — all calls run in the Electron main process and are
 * invoked through IPC handlers registered in main.js.
 */

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS farmers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  dob TEXT,
  place_of_birth TEXT,
  nin TEXT NOT NULL,
  issue_date TEXT,
  address TEXT,
  commune TEXT,
  daira TEXT,
  wilaya TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crop_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_category TEXT,
  superficie TEXT,
  product_nature TEXT,
  quantity_requested TEXT,
  period TEXT
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crop_request_id INTEGER NOT NULL REFERENCES crop_requests(id) ON DELETE CASCADE,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  operator TEXT,
  quantity_delivered TEXT,
  amount TEXT,
  invoice_number TEXT,
  delivery_date TEXT,
  service_done TEXT DEFAULT 'Non'
);

CREATE INDEX IF NOT EXISTS idx_crop_requests_farmer ON crop_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_farmer ON deliveries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_crop ON deliveries(crop_request_id);
`;

/** Open the database file and ensure the schema exists. */
function initDatabase(dbPath) {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialised. Call initDatabase() first.');
  return db;
}

/* ------------------------------------------------------------------ */
/* Farmers                                                             */
/* ------------------------------------------------------------------ */

const FARMER_FIELDS = [
  'last_name', 'first_name', 'dob', 'place_of_birth', 'nin', 'issue_date',
  'address', 'commune', 'daira', 'wilaya', 'phone'
];

const CROP_FIELDS = [
  'crop_category', 'superficie', 'product_nature', 'quantity_requested', 'period'
];

/**
 * Insert or update a farmer together with the full set of crop requests.
 * When farmer.id is present the row is updated and its crop requests are
 * fully replaced. Runs inside a transaction.
 */
function saveFarmer({ farmer, crops }) {
  const d = getDb();
  const cropList = Array.isArray(crops) ? crops : [];

  const insertCrop = d.prepare(`
    INSERT INTO crop_requests
      (farmer_id, crop_category, superficie, product_nature, quantity_requested, period)
    VALUES
      (@farmer_id, @crop_category, @superficie, @product_nature, @quantity_requested, @period)
  `);
  const updateCrop = d.prepare(`
    UPDATE crop_requests SET
      crop_category = @crop_category, superficie = @superficie,
      product_nature = @product_nature, quantity_requested = @quantity_requested,
      period = @period
    WHERE id = @id AND farmer_id = @farmer_id
  `);
  const deleteCrop = d.prepare('DELETE FROM crop_requests WHERE id = ?');

  const cropValues = (crop, farmerId) => ({
    farmer_id: farmerId,
    crop_category: str(crop.crop_category),
    superficie: str(crop.superficie),
    product_nature: str(crop.product_nature),
    quantity_requested: str(crop.quantity_requested),
    period: str(crop.period)
  });

  const tx = d.transaction(() => {
    let farmerId = farmer.id;

    if (farmerId) {
      d.prepare(`
        UPDATE farmers SET
          last_name = @last_name, first_name = @first_name, dob = @dob,
          place_of_birth = @place_of_birth, nin = @nin, issue_date = @issue_date,
          address = @address, commune = @commune, daira = @daira,
          wilaya = @wilaya, phone = @phone
        WHERE id = @id
      `).run(normaliseFarmer(farmer, true));

      // Diff crop requests instead of wiping them, so that deliveries attached
      // to unchanged crop rows are preserved. Only rows the user actually
      // removed in the UI are deleted (cascading their deliveries).
      const existingIds = d
        .prepare('SELECT id FROM crop_requests WHERE farmer_id = ?')
        .all(farmerId)
        .map((r) => r.id);
      const keptIds = [];

      for (const crop of cropList) {
        if (crop.id) {
          updateCrop.run({ ...cropValues(crop, farmerId), id: crop.id });
          keptIds.push(crop.id);
        } else if (!isEmptyCrop(crop)) {
          insertCrop.run(cropValues(crop, farmerId));
        }
      }

      for (const id of existingIds) {
        if (!keptIds.includes(id)) deleteCrop.run(id);
      }
    } else {
      const info = d.prepare(`
        INSERT INTO farmers
          (last_name, first_name, dob, place_of_birth, nin, issue_date,
           address, commune, daira, wilaya, phone)
        VALUES
          (@last_name, @first_name, @dob, @place_of_birth, @nin, @issue_date,
           @address, @commune, @daira, @wilaya, @phone)
      `).run(normaliseFarmer(farmer, false));
      farmerId = info.lastInsertRowid;

      for (const crop of cropList) {
        if (isEmptyCrop(crop)) continue;
        insertCrop.run(cropValues(crop, farmerId));
      }
    }

    return farmerId;
  });

  const farmerId = tx();
  return { success: true, farmerId };
}

function getFarmers() {
  return getDb().prepare(`
    SELECT * FROM farmers
    ORDER BY datetime(created_at) DESC, id DESC
  `).all();
}

function getFarmerDetail(id) {
  const d = getDb();
  const farmer = d.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
  if (!farmer) return { farmer: null, crops: [] };
  const crops = d.prepare(
    'SELECT * FROM crop_requests WHERE farmer_id = ? ORDER BY id ASC'
  ).all(id);
  return { farmer, crops };
}

function deleteFarmer(id) {
  getDb().prepare('DELETE FROM farmers WHERE id = ?').run(id);
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Crop requests                                                       */
/* ------------------------------------------------------------------ */

function getCropRequestsForFarmer(farmerId) {
  return getDb().prepare(
    'SELECT * FROM crop_requests WHERE farmer_id = ? ORDER BY id ASC'
  ).all(farmerId);
}

/* ------------------------------------------------------------------ */
/* Deliveries                                                          */
/* ------------------------------------------------------------------ */

const DELIVERY_SELECT = `
  SELECT
    dl.id                 AS id,
    dl.crop_request_id    AS crop_request_id,
    dl.farmer_id          AS farmer_id,
    dl.operator           AS operator,
    dl.quantity_delivered AS quantity_delivered,
    dl.amount             AS amount,
    dl.invoice_number     AS invoice_number,
    dl.delivery_date      AS delivery_date,
    dl.service_done       AS service_done,
    f.last_name           AS last_name,
    f.first_name          AS first_name,
    f.nin                 AS nin,
    cr.crop_category      AS crop_category,
    cr.superficie         AS superficie,
    cr.product_nature     AS product_nature,
    cr.quantity_requested AS quantity_requested,
    cr.period             AS period
  FROM deliveries dl
  JOIN farmers f       ON f.id  = dl.farmer_id
  JOIN crop_requests cr ON cr.id = dl.crop_request_id
`;

function getDeliveries(farmerId) {
  const d = getDb();
  if (farmerId) {
    return d.prepare(
      `${DELIVERY_SELECT} WHERE dl.farmer_id = ? ORDER BY dl.id DESC`
    ).all(farmerId);
  }
  return d.prepare(`${DELIVERY_SELECT} ORDER BY dl.id DESC`).all();
}

/** Insert or update a delivery row. */
function saveDelivery(delivery) {
  const d = getDb();
  const payload = {
    crop_request_id: delivery.crop_request_id,
    farmer_id: delivery.farmer_id,
    operator: str(delivery.operator),
    quantity_delivered: str(delivery.quantity_delivered),
    amount: str(delivery.amount),
    invoice_number: str(delivery.invoice_number),
    delivery_date: str(delivery.delivery_date),
    service_done: delivery.service_done === 'Oui' ? 'Oui' : 'Non'
  };

  if (delivery.id) {
    d.prepare(`
      UPDATE deliveries SET
        crop_request_id = @crop_request_id, farmer_id = @farmer_id,
        operator = @operator, quantity_delivered = @quantity_delivered,
        amount = @amount, invoice_number = @invoice_number,
        delivery_date = @delivery_date, service_done = @service_done
      WHERE id = @id
    `).run({ ...payload, id: delivery.id });
  } else {
    d.prepare(`
      INSERT INTO deliveries
        (crop_request_id, farmer_id, operator, quantity_delivered, amount,
         invoice_number, delivery_date, service_done)
      VALUES
        (@crop_request_id, @farmer_id, @operator, @quantity_delivered, @amount,
         @invoice_number, @delivery_date, @service_done)
    `).run(payload);
  }
  return { success: true };
}

function deleteDelivery(id) {
  getDb().prepare('DELETE FROM deliveries WHERE id = ?').run(id);
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function str(v) {
  if (v === undefined || v === null) return '';
  return String(v);
}

function normaliseFarmer(farmer, withId) {
  const out = {};
  for (const f of FARMER_FIELDS) out[f] = str(farmer[f]);
  if (withId) out.id = farmer.id;
  return out;
}

function isEmptyCrop(crop) {
  return CROP_FIELDS.every((f) => !crop[f] || String(crop[f]).trim() === '');
}

module.exports = {
  initDatabase,
  getDb,
  saveFarmer,
  getFarmers,
  getFarmerDetail,
  deleteFarmer,
  getCropRequestsForFarmer,
  getDeliveries,
  saveDelivery,
  deleteDelivery
};
