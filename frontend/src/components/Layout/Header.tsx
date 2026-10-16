import { Link } from 'react-router-dom';

import { useTranslation } from '../../i18n/useTranslation';
import classes from './Header.module.css';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className={classes.header}>
      <Link to="/" className={classes.brand}>
        <h1>{t.appTitle}</h1>
        <span className={classes.badge}>{t.badge}</span>
      </Link>
      <nav>
        <Link to="/settings" className={classes.settingsLink}>
          {t.settingsLink}
        </Link>
      </nav>
    </header>
  );
};

export default Header;
