import { Route, Routes } from 'react-router-dom';

import Header from './components/Layout/Header';
import AddRecipePage from './pages/AddRecipePage';
import HomePage from './pages/HomePage';
import SavedRecipesPage from './pages/SavedRecipesPage';
import SettingsPage from './pages/SettingsPage';
import classes from './App.module.css';

function App() {
  return (
    <>
      <Header />
      <main className={classes.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/import" element={<AddRecipePage />} />
          <Route path="/saved" element={<SavedRecipesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
