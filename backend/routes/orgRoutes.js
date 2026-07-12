const express = require('express');
const router = express.Router();
const orgService = require('../services/orgService.js');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/rbac');

router.use(authenticate);

// --- Departments (Admin only to create/edit; anyone can view) ---
router.get('/departments', async (req, res) => {
  try {
    res.json(await orgService.listDepartments());
  } catch (err) {
    res.status(500).json({ error: 'Could not load departments.' });
  }
});

router.post('/departments', requireRole(['admin']), async (req, res) => {
  try {
    const dept = await orgService.createDepartment(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ error: 'Could not create department.' });
  }
});

router.put('/departments/:id', requireRole(['admin']), async (req, res) => {
  try {
    await orgService.updateDepartment(req.params.id, req.body);
    res.json({ message: 'Department updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not update department.' });
  }
});

// --- Asset Categories ---
router.get('/categories', async (req, res) => {
  try {
    res.json(await orgService.listCategories());
  } catch (err) {
    res.status(500).json({ error: 'Could not load categories.' });
  }
});

router.post('/categories', requireRole(['admin']), async (req, res) => {
  try {
    const category = await orgService.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Could not create category.' });
  }
});

// --- Employee Directory ---
router.get('/employees', requireRole(['admin', 'asset_manager', 'department_head']), async (req, res) => {
  try {
    res.json(await orgService.listEmployees());
  } catch (err) {
    res.status(500).json({ error: 'Could not load employee directory.' });
  }
});

// The only endpoint that can elevate a role — Admin only.
router.put('/employees/:id/role', requireRole(['admin']), async (req, res) => {
  try {
    await orgService.promoteEmployee(req.params.id, req.body.role);
    res.json({ message: 'Employee role updated.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not update role.' });
  }
});

router.put('/employees/:id/status', requireRole(['admin']), async (req, res) => {
  try {
    await orgService.updateEmployeeStatus(req.params.id, req.body.status);
    res.json({ message: 'Employee status updated.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not update status.' });
  }
});

module.exports = router;
