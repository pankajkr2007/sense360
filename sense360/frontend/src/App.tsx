import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Modes from './pages/Modes';
import Vision from './pages/Vision';
import Sound from './pages/Sound';
import Wristband from './pages/Wristband';
import Settings from './pages/Settings';
import History from './pages/History';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/modes" element={<Modes />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/sound" element={<Sound />} />
        <Route path="/wristband" element={<Wristband />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<p>Page not found. <Link className="underline" to="/">Go to the start</Link>.</p>} />
      </Route>
    </Routes>
  );
}
