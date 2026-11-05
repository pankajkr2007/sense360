import { Link } from 'react-router-dom';

const modes = [
  { to: '/vision', title: 'Vision', who: 'Blind and low-vision users', text: 'Point the camera or upload a photo. Hear detected objects and read printed text aloud.' },
  { to: '/sound', title: 'Sound', who: 'Deaf and hard-of-hearing users', text: 'Record or upload audio. Get an alert when a horn, siren, alarm or doorbell is recognised.' },
  { to: '/wristband', title: 'Virtual wristband', who: 'Both modes', text: 'See and test the vibration pattern for each event. The connection is simulated.' },
];

export default function Modes() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Choose a mode</h1>
      <p className="muted mt-2">Each mode works on its own.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {modes.map((m) => (
          <Link key={m.to} to={m.to} className="card block hover:border-teal">
            <h2 className="text-2xl font-bold">{m.title}</h2>
            <p className="mt-1 font-bold text-teal">{m.who}</p>
            <p className="muted mt-3">{m.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
