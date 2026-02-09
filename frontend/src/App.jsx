import { Routes, Route } from 'react-router-dom';
import Layout from './shared/components/Layout';
import HomePage from './features/rates/pages/HomePage';
import SettingsPage from './features/settings/pages/SettingsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
