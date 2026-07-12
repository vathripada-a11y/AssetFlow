import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({ name: '', categoryId: '', serialNumber: '', location: '', isBookable: false });
  const [allocateFor, setAllocateFor] = useState(null);
  const [employeeId, setEmployeeId] = useState('');

  function loadAll() {
    client.get('/assets').then((r) => setAssets(r.data)).catch(() => {});
    client.get('/org/categories').then((r) => setCategories(r.data)).catch(() => {});
    client.get('/org/employees').then((r) => setEmployees(r.data)).catch(() => {});
  }

  useEffect(() => { loadAll(); }, []);

  async function registerAsset(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const res = await client.post('/assets', form);
      setMessage(`Asset registered as ${res.data.assetTag}.`);
      setForm({ name: '', categoryId: '', serialNumber: '', location: '', isBookable: false });
      loadAll();
    } catch (err) { setError(err.message); }
  }

  async function allocate(assetId) {
    setError(''); setMessage('');
    try {
      await client.post(`/assets/${assetId}/allocate`, { employeeId });
      setMessage('Asset allocated.');
      setAllocateFor(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestTransfer(assetId) {
    setError(''); setMessage('');
    try {
      await client.post(`/assets/${assetId}/transfer-request`);
      setMessage('Transfer request submitted.');
    } catch (err) { setError(err.message); }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h2>Asset Registration & Directory</h2>

      <form onSubmit={registerAsset} style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input placeholder="Asset name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ padding: 8 }} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={{ padding: 8 }}>
          <option value="">Category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="Serial number" value={form.serialNumber}
          onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} style={{ padding: 8 }} />
        <input placeholder="Location" value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ padding: 8 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={form.isBookable}
            onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} />
          Bookable
        </label>
        <button type="submit">Register Asset</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Tag</th><th>Name</th><th>Category</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{a.asset_tag}</td>
              <td>{a.name}</td>
              <td>{a.category_name || '—'}</td>
              <td>{a.status}</td>
              <td>
                {allocateFor !== a.id && ( <button onClick={() => setAllocateFor(a.id)}>Allocate</button> )}
                {allocateFor === a.id && (
                  <>
                    <select onChange={(e) => setEmployeeId(e.target.value)} style={{ marginRight: 4 }}>
                      <option value="">Select employee</option>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <button onClick={() => allocate(a.id)}>Confirm</button>
                  </>
                )}
                {a.status === 'allocated' && (
                  <button onClick={() => requestTransfer(a.id)}>Request Transfer</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}