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
  raison_sociale TEXT NOT NULL DEFAULT '',
  fax TEXT DEFAULT '',
  work_permit_ref TEXT DEFAULT '',
  subdivision TEXT DEFAULT '',
  num_carte_nationale TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crop_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_category TEXT,
  type TEXT DEFAULT '',
  superficie TEXT,
  product_nature TEXT,
  quantity_requested TEXT,
  quantity_unit TEXT DEFAULT 'Kg',
  period TEXT,
  validee_annee TEXT DEFAULT '',
  chambre_agri_wilaya TEXT DEFAULT '',
  activite_principale TEXT DEFAULT '',
  adresse_exploitation TEXT DEFAULT '',
  sat_ha TEXT DEFAULT '',
  sau_ha TEXT DEFAULT '',
  types_culture_fertiliser TEXT DEFAULT '',
  superficie_fertiliser_ha TEXT DEFAULT '',
  type_engrais_sollicite TEXT DEFAULT '',
  qte_engrais_autorisee_ql TEXT DEFAULT '',
  periode_epandage TEXT DEFAULT '',
  date_limite_utilisation TEXT DEFAULT ''
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

  // Run migrations to alter existing databases safely
  try {
    db.exec(`ALTER TABLE farmers ADD COLUMN raison_sociale TEXT NOT NULL DEFAULT ''`);
  } catch (e) {
    // Column already exists or table doesn't exist
  }
  try {
    db.exec(`ALTER TABLE farmers ADD COLUMN fax TEXT DEFAULT ''`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE farmers ADD COLUMN work_permit_ref TEXT DEFAULT ''`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE farmers ADD COLUMN subdivision TEXT DEFAULT ''`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE farmers ADD COLUMN num_carte_nationale TEXT DEFAULT ''`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN quantity_unit TEXT DEFAULT 'Kg'`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN type TEXT DEFAULT ''`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN validee_annee TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN chambre_agri_wilaya TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN activite_principale TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN adresse_exploitation TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN sat_ha TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN sau_ha TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN types_culture_fertiliser TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN superficie_fertiliser_ha TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN type_engrais_sollicite TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN qte_engrais_autorisee_ql TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN periode_epandage TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE crop_requests ADD COLUMN date_limite_utilisation TEXT DEFAULT ''`);
  } catch (e) {}

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
  'address', 'commune', 'daira', 'wilaya', 'phone', 'raison_sociale', 'fax', 'work_permit_ref', 'subdivision', 'num_carte_nationale'
];

const CROP_FIELDS = [
  'crop_category', 'type', 'superficie', 'product_nature', 'quantity_requested', 'quantity_unit', 'period',
  'validee_annee', 'chambre_agri_wilaya', 'activite_principale', 'adresse_exploitation', 'sat_ha', 'sau_ha',
  'types_culture_fertiliser', 'superficie_fertiliser_ha', 'type_engrais_sollicite', 'qte_engrais_autorisee_ql', 'periode_epandage',
  'date_limite_utilisation'
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
      (farmer_id, crop_category, type, superficie, product_nature, quantity_requested, quantity_unit, period,
       validee_annee, chambre_agri_wilaya, activite_principale, adresse_exploitation, sat_ha, sau_ha,
       types_culture_fertiliser, superficie_fertiliser_ha, type_engrais_sollicite, qte_engrais_autorisee_ql, periode_epandage,
       date_limite_utilisation)
    VALUES
      (@farmer_id, @crop_category, @type, @superficie, @product_nature, @quantity_requested, @quantity_unit, @period,
       @validee_annee, @chambre_agri_wilaya, @activite_principale, @adresse_exploitation, @sat_ha, @sau_ha,
       @types_culture_fertiliser, @superficie_fertiliser_ha, @type_engrais_sollicite, @qte_engrais_autorisee_ql, @periode_epandage,
       @date_limite_utilisation)
  `);
  const updateCrop = d.prepare(`
    UPDATE crop_requests SET
      crop_category = @crop_category, type = @type, superficie = @superficie,
      product_nature = @product_nature, quantity_requested = @quantity_requested,
      quantity_unit = @quantity_unit, period = @period,
      validee_annee = @validee_annee, chambre_agri_wilaya = @chambre_agri_wilaya,
      activite_principale = @activite_principale, adresse_exploitation = @adresse_exploitation,
      sat_ha = @sat_ha, sau_ha = @sau_ha, types_culture_fertiliser = @types_culture_fertiliser,
      superficie_fertiliser_ha = @superficie_fertiliser_ha, type_engrais_sollicite = @type_engrais_sollicite,
      qte_engrais_autorisee_ql = @qte_engrais_autorisee_ql, periode_epandage = @periode_epandage,
      date_limite_utilisation = @date_limite_utilisation
    WHERE id = @id AND farmer_id = @farmer_id
  `);
  const deleteCrop = d.prepare('DELETE FROM crop_requests WHERE id = ?');

  const cropValues = (crop, farmerId) => ({
    farmer_id: farmerId,
    crop_category: str(crop.crop_category),
    type: str(crop.type),
    superficie: str(crop.superficie),
    product_nature: str(crop.product_nature).toUpperCase(), // Nature du Produit saved as uppercase
    quantity_requested: str(crop.quantity_requested),
    quantity_unit: str(crop.quantity_unit || 'Kg'),
    period: str(crop.period),
    validee_annee: str(crop.validee_annee),
    chambre_agri_wilaya: str(crop.chambre_agri_wilaya),
    activite_principale: str(crop.activite_principale),
    adresse_exploitation: str(crop.adresse_exploitation),
    sat_ha: str(crop.sat_ha),
    sau_ha: str(crop.sau_ha),
    types_culture_fertiliser: str(crop.types_culture_fertiliser),
    superficie_fertiliser_ha: str(crop.superficie_fertiliser_ha),
    type_engrais_sollicite: str(crop.type_engrais_sollicite),
    qte_engrais_autorisee_ql: str(crop.qte_engrais_autorisee_ql),
    periode_epandage: str(crop.periode_epandage),
    date_limite_utilisation: str(crop.date_limite_utilisation)
  });

  const tx = d.transaction(() => {
    let farmerId = farmer.id;

    if (farmerId) {
      d.prepare(`
        UPDATE farmers SET
          last_name = @last_name, first_name = @first_name, dob = @dob,
          place_of_birth = @place_of_birth, nin = @nin, issue_date = @issue_date,
          address = @address, commune = @commune, daira = @daira,
          wilaya = @wilaya, phone = @phone, raison_sociale = @raison_sociale,
          fax = @fax, work_permit_ref = @work_permit_ref, subdivision = @subdivision,
          num_carte_nationale = @num_carte_nationale
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
           address, commune, daira, wilaya, phone, raison_sociale, fax, work_permit_ref, subdivision, num_carte_nationale)
        VALUES
          (@last_name, @first_name, @dob, @place_of_birth, @nin, @issue_date,
           @address, @commune, @daira, @wilaya, @phone, @raison_sociale, @fax, @work_permit_ref, @subdivision, @num_carte_nationale)
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

function getFarmerByNIN(nin) {
  if (!nin) return null;
  return getDb().prepare('SELECT * FROM farmers WHERE nin = ? OR num_carte_nationale = ?').get(nin, nin) || null;
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
    cr.id                 AS id,
    dl.id                 AS delivery_id,
    cr.id                 AS crop_request_id,
    cr.farmer_id          AS farmer_id,
    dl.operator           AS operator,
    dl.quantity_delivered AS quantity_delivered,
    dl.amount             AS amount,
    dl.invoice_number     AS invoice_number,
    dl.delivery_date      AS delivery_date,
    dl.service_done       AS service_done,
    f.last_name           AS last_name,
    f.first_name          AS first_name,
    f.nin                 AS nin,
    f.num_carte_nationale AS num_carte_nationale,
    f.phone               AS phone,
    cr.crop_category      AS crop_category,
    cr.type               AS type,
    cr.superficie         AS superficie,
    cr.product_nature     AS product_nature,
    cr.quantity_requested AS quantity_requested,
    cr.quantity_unit      AS quantity_unit,
    cr.period             AS period,
    cr.validee_annee      AS validee_annee,
    cr.chambre_agri_wilaya AS chambre_agri_wilaya,
    cr.activite_principale AS activite_principale,
    cr.adresse_exploitation AS adresse_exploitation,
    cr.sat_ha             AS sat_ha,
    cr.sau_ha             AS sau_ha,
    cr.types_culture_fertiliser AS types_culture_fertiliser,
    cr.superficie_fertiliser_ha AS superficie_fertiliser_ha,
    cr.type_engrais_sollicite AS type_engrais_sollicite,
    cr.qte_engrais_autorisee_ql AS qte_engrais_autorisee_ql,
    cr.periode_epandage   AS periode_epandage,
    cr.date_limite_utilisation AS date_limite_utilisation
  FROM crop_requests cr
  JOIN farmers f        ON f.id = cr.farmer_id
  LEFT JOIN deliveries dl ON dl.crop_request_id = cr.id
`;

function getDeliveries(farmerId) {
  const d = getDb();
  if (farmerId) {
    return d.prepare(
      `${DELIVERY_SELECT} WHERE cr.farmer_id = ? ORDER BY COALESCE(dl.id, 0) DESC, cr.id DESC`
    ).all(farmerId);
  }
  return d.prepare(`${DELIVERY_SELECT} ORDER BY COALESCE(dl.id, 0) DESC, cr.id DESC`).all();
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

  // Convert delivery_date from DD/MM/YYYY to YYYY-MM-DD for database storage
  if (payload.delivery_date && /^\d{2}\/\d{2}\/\d{4}$/.test(payload.delivery_date)) {
    const [day, m, y] = payload.delivery_date.split('/');
    payload.delivery_date = `${y}-${m}-${day}`;
  }

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

  // Convert dob and issue_date to YYYY-MM-DD for database storage
  if (out.dob && /^\d{2}\/\d{2}\/\d{4}$/.test(out.dob)) {
    const [d, m, y] = out.dob.split('/');
    out.dob = `${y}-${m}-${d}`;
  }
  if (out.issue_date && /^\d{2}\/\d{2}\/\d{4}$/.test(out.issue_date)) {
    const [d, m, y] = out.issue_date.split('/');
    out.issue_date = `${y}-${m}-${d}`;
  }

  if (withId) out.id = farmer.id;
  return out;
}

function isEmptyCrop(crop) {
  // Check primary crop fields to decide if row is empty (ignore quantity_unit default value 'Kg' / 'L')
  return ['crop_category', 'type', 'superficie', 'product_nature', 'quantity_requested', 'period'].every(
    (f) => !crop[f] || String(crop[f]).trim() === ''
  );
}

module.exports = {
  initDatabase,
  getDb,
  saveFarmer,
  getFarmers,
  getFarmerDetail,
  getFarmerByNIN,
  deleteFarmer,
  getCropRequestsForFarmer,
  getDeliveries,
  saveDelivery,
  deleteDelivery
};
