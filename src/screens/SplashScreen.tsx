import './splash.css';

export function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash__mark">
        <span className="splash__logo">Qlue</span>
        <span className="splash__ai">AI</span>
      </div>
      <span className="splash__tag">Voice-first interview practice</span>
    </div>
  );
}
