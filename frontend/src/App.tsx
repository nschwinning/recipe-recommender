import { Route, Routes } from 'react-router-dom';

import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import classes from './App.module.css';

function App() {
  return (
    <>
      <Header />
      <main className={classes.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
