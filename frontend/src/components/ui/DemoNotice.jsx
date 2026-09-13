import './DemoNotice.css';

export default function DemoNotice({ text, className = '' }) {
  return (
    <div className={`demo-notice ${className}`.trim()} role="note" aria-label="Demo prototype notice">
      <span className="demo-notice-badge">DEMO / PROTOTYPE</span>
      <span className="demo-notice-text">
        {text || (
          <>
            <strong>College hackathon demo.</strong> Simulated data stored locally in your
            browser — not connected to real emergency services. For real emergencies call{' '}
            <strong>112</strong>.
          </>
        )}
      </span>
    </div>
  );
}
