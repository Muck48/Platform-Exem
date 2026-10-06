const itemService = require('../services/itemService');

async function create(req, res, next) {
  try {
    const result = await itemService.createItem(req.body);
    const created = await itemService.getItemById(result.id);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function list(_req, res, next) {
  try {
    const items = await itemService.getAllItems();
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}

async function readOne(req, res, next) {
  try {
    const item = await itemService.getItemById(req.params.id);

    if (!item) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const changes = await itemService.updateItem(req.params.id, req.body);

    if (!changes) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    const updated = await itemService.getItemById(req.params.id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const changes = await itemService.deleteItem(req.params.id);

    if (!changes) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    res.status(200).json({ success: true, data: { message: 'Item deleted' } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  readOne,
  update,
  remove
};
