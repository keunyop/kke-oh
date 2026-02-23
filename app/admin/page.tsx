import { isAdminAuthorized } from '@/lib/security/admin';

async function call(path: string) {
  'use server';
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}${path}`, { method: 'POST' });
}

async function addBlocklist(formData: FormData) {
  'use server';
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/blocklist`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      type: formData.get('type'),
      valueHashOrValue: formData.get('valueHashOrValue'),
      reason: formData.get('reason')
    })
  });
}

export default async function AdminPage() {
  if (!isAdminAuthorized()) {
    return (
      <form className="card" method="post" action="/api/admin/auth">
        <h2>Admin Login</h2>
        <input name="secret" type="password" placeholder="ADMIN_SECRET" required />
        <button type="submit">Unlock admin</button>
      </form>
    );
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/admin/games`, { cache: 'no-store' });
  const json = await res.json();
  const games = json.games ?? [];

  return (
    <section>
      <h1>Admin Panel</h1>
      <form className="card" action={addBlocklist}>
        <h3>Add to blocklist</h3>
        <div className="inline">
          <select name="type" defaultValue="EMAIL">
            <option value="EMAIL">EMAIL</option>
            <option value="IP">IP</option>
          </select>
          <input name="valueHashOrValue" placeholder="hashed email or hashed ip" required />
        </div>
        <input name="reason" placeholder="Reason" />
        <button type="submit">Add blocklist entry</button>
      </form>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Title</th><th>Status</th><th>Hidden</th><th>Reports</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game: any) => (
              <tr key={game.id}>
                <td>{game.title}</td>
                <td>{game.status}</td>
                <td>{String(game.is_hidden)}</td>
                <td>{game.report_count}</td>
                <td>{new Date(game.created_at).toLocaleString()}</td>
                <td>
                  <div className="inline">
                    <form action={call.bind(null, `/api/admin/games/${game.id}/hide`)}><button type="submit">Hide</button></form>
                    <form action={call.bind(null, `/api/admin/games/${game.id}/unhide`)}><button type="submit">Unhide</button></form>
                    <form action={call.bind(null, `/api/admin/games/${game.id}/delete`)}><button type="submit">Delete</button></form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
