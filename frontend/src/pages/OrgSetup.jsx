import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function OrgSetup() {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [deptName, setDeptName] = useState('');
  const [catName, setCatName] = useState('');

  function loadAll() {
    setLoading(true);
    Promise.all([
      client.get('/org/departments'),
      client.get('/org/categories'),
      client.get('/org/employees')
    ])
      .then(([deptRes, catRes, empRes]) => {
        setDepartments(deptRes.data);
        setCategories(catRes.data);
        setEmployees(empRes.data);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load organization settings.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function createDepartment(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/org/departments', { name: deptName });
      setDeptName('');
      setMessage('Department created successfully.');
      loadAll();
    } catch (err) { setError(err.message || 'Failed to create department.'); }
  }

  async function createCategory(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/org/categories', { name: catName });
      setCatName('');
      setMessage('Category created successfully.');
      loadAll();
    } catch (err) { setError(err.message || 'Failed to create category.'); }
  }

  async function changeRole(employeeId, role) {
    setError(''); setMessage('');
    try {
      await client.put(`/org/employees/${employeeId}/role`, { role });
      setMessage('Employee role updated.');
      loadAll();
    } catch (err) { setError(err.message || 'Failed to update employee role.'); }
  }

  return (
    <div className="assets-page" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p className="eyebrow">Administration</p>
          <h2 className="page-heading">Organization Setup & RBAC</h2>
          <p className="page-subtitle">Configure organizational departments, asset categories, user roles, and access controls.</p>
        </div>
        <Link to="/dashboard" className="text-link">← Dashboard</Link>
      </div>

      {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
      {message && <p className="form-success" style={{ marginBottom: 16 }}>{message}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['departments', 'categories', 'employees'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn"
            style={{
              padding: '8px 18px',
              fontSize: 14,
              borderRadius: 8,
              background: tab === t ? '#7b5bff' : '#ffffff',
              color: tab === t ? '#ffffff' : '#1f1644',
              border: tab === t ? 'none' : '1px solid rgba(20,12,60,0.08)'
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#6b5fa6' }}>
          Loading organization data...
        </div>
      ) : tab === 'departments' ? (
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={createDepartment} style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <input
              placeholder="New department name (e.g. Engineering)"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: 240 }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
              Add Department
            </button>
          </form>

          <div className="table-card">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Department Name</th>
                  <th>Department Head</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.id}>
                    <td>#{d.id}</td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.head_name || 'Unassigned'}</td>
                    <td><span className="badge badge-available">{d.status || 'Active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'categories' ? (
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={createCategory} style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <input
              placeholder="New category name (e.g. Electronics, Vehicles)"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: 240 }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
              Add Category
            </button>
          </form>

          <div className="table-card">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 28 }}>
          <div className="table-card">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Current Role</th>
                  <th>Promote / Change Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.email}</td>
                    <td>{e.department_name || '—'}</td>
                    <td>
                      <span className="badge badge-available" style={{ fontSize: 11 }}>
                        {e.role}
                      </span>
                    </td>
                    <td>
                      <select
                        onChange={(ev) => changeRole(e.id, ev.target.value)}
                        value={e.role}
                        className="form-input"
                        style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}
                      >
                        <option value="employee">Employee</option>
                        <option value="department_head">Department Head</option>
                        <option value="asset_manager">Asset Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}