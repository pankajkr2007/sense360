import { Link } from 'react-router-dom';

export default function Welcome() {
  return (
    <section className="py-8">
      <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Sound and sight alerts you can feel, hear or see.</h1>
      <p className="muted mt-5 max-w-xl text-lg">SENSE360 is a hackathon prototype. Vision Mode names objects and reads text aloud. Sound Mode listens for horns, sirens, alarms and doorbells and sends a vibration pattern to a virtual wristband.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/modes" className="btn btn-primary">Choose a mode</Link>
        <Link to="/settings" className="btn">Settings</Link>
      </div>
      <div className="card mt-10 max-w-2xl">
        <h2 className="text-lg font-bold">What this prototype is not</h2>
        <p className="muted mt-2">It is not a safety device or a navigation aid, and no physical wristband is connected. Do not rely on it to cross roads or react to danger. Camera images and raw audio stay on your device or local server and are not saved.</p>
      </div>
    </section>
  );
}
