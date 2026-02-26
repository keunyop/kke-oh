export default function SubmitPage() {
  return (
    <section>
      <h1>Developer-only game setup</h1>
      <div className="card">
        <p>This MVP does not use DB, object storage, or public uploads.</p>
        <p>Add each game directly to the server filesystem:</p>
        <pre>
          <code>{`data/games/<game-id>/
  game.json
  index.html
  ...assets`}</code>
        </pre>
        <p className="small">
          After files are added, refresh the home page. The game appears at <code>/game/&lt;game-id&gt;</code>.
        </p>
      </div>
    </section>
  );
}
