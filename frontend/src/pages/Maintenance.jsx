import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  function loadAll() {
    client.get('/maintenance').then((r) => setRequests(r.data)).catch(() => {});
    client.get('/assets').then((r) => setAssets(r.data)).catch(() => {});
  }

  useEffect(() => { loadAll(); }, []);

  async function raiseRequest(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/maintenance', { assetId, issueDescription: issue, priority });
      setMessage('Maintenance request raised.');
      setIssue(''); setAssetId('');
      loadAll();
    } catch (err) { setError(err.message); }
  }

  async function act(id, action) {
    setError(''); setMessage('');
    try {
      await client.put(`/maintenance/${id}/${action}`);
      setMessage(`Request ${action.replace('-', ' ')}.`);
      loadAll();
    } catch (err) { setError(err.message); }
  }

  const isAssetManager = user?.role === 'asset_manager';

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h2>Maintenance Management</h2>

      <form onSubmit={raiseRequest} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <select value={assetId} onChange={(e) => setAssetId(e.target.value)} required style={{ padding: 8 }}>
          <option value="">Select asset</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.asset_tag} — {a.name}</option>)}
        </select>
        <input placeholder="Describe the issue" value={issue}
          onChange={(e) => setIssue(e.target.value)} required style={{ padding: 8, minWidth: 200 }} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: 8 }}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Raise Request</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Asset</th><th>Issue</th><th>Priority</th><th>Status</th>
            {isAssetManager && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{r.asset_tag} — {r.asset_name}</td>
              <td>{r.issue_description}</td>
              <td>{r.priority}</td>
              <td>{r.status}</td>
              {isAssetManager && (
                <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => act(r.id, 'approve')}>Approve</button>
                      <button onClick={() => act(r.id, 'reject')}>Reject</button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => act(r.id, 'in-progress')}>Mark In Progress</button>
                  )}
                  {r.status === 'in_progress' && (
                    <button onClick={() => act(r.id, 'resolve')}>Resolve</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}