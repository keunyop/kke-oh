import { isAdminAuthorized } from '@/lib/security/admin';
import { getGameRepository } from '@/lib/games/repository';
import { revalidatePath } from 'next/cache';

async function hideGame(id: string) {
  'use server';
  await getGameRepository().hide(id, 'Hidden by admin');
  revalidatePath('/admin');
}

async function unhideGame(id: string) {
  'use server';
  await getGameRepository().unhide(id);
  revalidatePath('/admin');
}

async function removeGame(id: string) {
  'use server';
  await getGameRepository().remove(id);
  revalidatePath('/admin');
}

export default async function AdminPage() {
  if (!isAdminAuthorized()) {
    const adminSecretConfigured = Boolean(process.env.ADMIN_SECRET?.trim());

    return (
      <form className="card" method="post" action="/api/admin/auth">
        <h2>Admin Login</h2>
        <input name="secret" type="password" placeholder="ADMIN_SECRET" required />
        <button type="submit">Unlock admin</button>
        {!adminSecretConfigured ? (
          <p className="small">ADMIN_SECRET is not configured. Set it in .env.local first.</p>
        ) : null}
      </form>
    );
  }

  const games = await getGameRepository().listForAdmin(200);

  return (
    <section>
      <h1>Admin Panel</h1>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Title</th><th>Status</th><th>Hidden</th><th>Reports</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id}>
                <td>{game.title}</td>
                <td>{game.status}</td>
                <td>{String(game.is_hidden)}</td>
                <td>{game.report_count}</td>
                <td>{new Date(game.created_at).toLocaleString()}</td>
                <td>
                  <div className="inline">
                    <form action={hideGame.bind(null, game.id)}><button type="submit">Hide</button></form>
                    <form action={unhideGame.bind(null, game.id)}><button type="submit">Unhide</button></form>
                    <form action={removeGame.bind(null, game.id)}><button type="submit">Delete</button></form>
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
