export function UploadCTA() {
  return (
    <section className="upload-cta" id="makers">
      <div>
        <span className="upload-cta-kicker">Upload</span>
        <h2>Share what you made.</h2>
        <p>Built something fun? Put it on Kke-oh.</p>
      </div>
      <div className="upload-cta-actions">
        <a href="/submit" className="button-primary">
          Upload Your Game
        </a>
        <p>ZIP upload. Quick publish.</p>
      </div>
    </section>
  );
}
