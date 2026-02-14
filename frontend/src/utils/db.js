import { openDB } from 'idb';

const dbPromise = openDB('pos-db', 1, {
  upgrade(db) {
    db.createObjectStore('invoices', { keyPath: 'id' });
  }
});

export const saveInvoiceOffline = async (invoice) => {
  const db = await dbPromise;
  await db.put('invoices', invoice);
};

export const getOfflineInvoices = async () => {
  const db = await dbPromise;
  return await db.getAll('invoices');
};