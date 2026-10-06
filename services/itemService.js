const { all, get, run } = require('../db/database');

function createItem(payload) {
  const { name, description = null } = payload;
  return run('INSERT INTO items (name, description) VALUES (?, ?)', [name, description]);
}

function getAllItems() {
  return all('SELECT id, name, description, created_at FROM items ORDER BY id ASC');
}

function getItemById(id) {
  return get('SELECT id, name, description, created_at FROM items WHERE id = ?', [id]);
}

async function updateItem(id, payload) {
  const { name, description = null } = payload;
  const result = await run('UPDATE items SET name = ?, description = ? WHERE id = ?', [name, description, id]);
  return result.changes;
}

async function deleteItem(id) {
  const result = await run('DELETE FROM items WHERE id = ?', [id]);
  return result.changes;
}

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem
};
