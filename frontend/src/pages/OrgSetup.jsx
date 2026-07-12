import { useEffect, useState } from 'react';
import client from '../api/client';

export default function OrgSetup() {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [deptName, setDeptName] = useState('');
  const [catName, setCatName] = useState('');

  function loadAll() {
    client.get('/org/departments').then((r) => setDepartments(r.data)).catch(() => {});
    client.get('/org/categories').then((r) => setCategories(r.data)).catch(() => {});
    client.get('/org/employees').then((r) => setEmployees(r.data)).catch(() => {});
  }

  useEffect(() => { loadAll(); }, []);

  async function createDepartment(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/org/departments', { name: deptName });
      setDeptName('');
      setMessage('Department created.');
      loadAll();
    } catch (err) { setError(err.message); }
  }

  async function createCategory(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/org/categories', { name: catName });
      setCatName('');
      setMessage('Category created.');
      loadAll();
    } catch (err) { setError(err.message); }
  }

  async function changeRole(employeeId, role) {
    setError(''); setMessage('');
    try {
      await client.put(`/org/employees/${employeeId}/role`, { role });
      setMessage('Role updated.');
      loadAll();
    } catch (err) { setError(err.message); }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h2>Organization Setup</h2>
      <div style={{ marginBottom: 16 }}>
        {['departments', 'categories', 'employees'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              marginRight: 8, padding: '6px 14px',
              background: tab === t ? '#333' : '#eee',
              color: tab === t ? '#fff' : '#333', border: 'none', borderRadius: 4
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {tab === 'departments' && (
        <div>
          <form onSubmit={createDepartment} style={{ marginBottom: 16 }}>
            <input
              placeholder="Department name"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              style={{ padding: 8, marginRight: 8 }}
              required
            />
            <button type="submit">Add Department</button>
          </form>
          <ul>
            {departments.map((d) => (
              <li key={d.id}>{d.name} — {d.status} {d.head_name ? `(Head: ${d.head_name})` : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <form onSubmit={createCategory} style={{ marginBottom: 16 }}>
            <input
              placeholder="Category name (e.g. Electronics)"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              style={{ padding: 8, marginRight: 8 }}
              required
            />
            <button type="submit">Add Category</button>
          </form>
          <ul>
            {categories.map((c) => <li key={c.id}>{c.name}</li>)}
          </ul>
        </div>
      )}

      {tab === 'employees' && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
              <th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Promote to</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{e.name}</td>
                <td>{e.email}</td>
                <td>{e.department_name || '—'}</td>
                <td>{e.role}</td>
                <td>
                  <select onChange={(ev) => changeRole(e.id, ev.target.value)} defaultValue="">
                    <option value="" disabled>Select role</option>
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
      )}
    </div>
  );
}