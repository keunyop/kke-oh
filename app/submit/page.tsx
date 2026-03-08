import SubmitForm from './submit-form';

export default function SubmitPage() {
  return (
    <div className="upload-page">
      <section className="upload-hero">
        <div>
          <span className="pill-label">Upload Game</span>
          <h1>Share what you made.</h1>
          <p>Your first game can look right at home here. Upload a ZIP, preview the safety checks, and publish in a few steps.</p>
        </div>
        <div className="upload-hero-panel">
          <strong>Before you upload</strong>
          <p>Keep it browser-friendly, bundle everything in one ZIP, and include an `index.html` entry file.</p>
        </div>
      </section>
      <SubmitForm />
    </div>
  );
}
