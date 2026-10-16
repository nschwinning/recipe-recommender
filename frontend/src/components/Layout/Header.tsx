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
      <nav className={classes.nav}>
        <Link to="/import" className={classes.navLink}>
          {t.importLink}
        </Link>
        <Link to="/saved" className={classes.navLink}>
          {t.savedLink}
        </Link>
        <Link to="/settings" className={classes.navLink}>
          {t.settingsLink}
        </Link>
      </nav>
    </header>
  );
};

export default Header;
