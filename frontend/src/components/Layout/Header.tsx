import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useTranslation } from '../../i18n/useTranslation';
import classes from './Header.module.css';

/** Active-aware class for a left-hand menu item. */
const menuLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${classes.menuLink} ${classes.menuLinkActive}` : classes.menuLink;

const Header = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className={classes.header}>
      <div className={classes.left}>
        <Link to="/" className={classes.brand} onClick={closeMenu}>
          <h1 className={classes.brandName}>{t.appTitle}</h1>
          <span className={classes.badge}>{t.badge}</span>
        </Link>

        <button
          type="button"
          className={classes.menuToggle}
          aria-label={t.menu}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <nav className={open ? `${classes.menu} ${classes.menuOpen}` : classes.menu}>
          <NavLink to="/" end className={menuLinkClass} onClick={closeMenu}>
            {t.todayLink}
          </NavLink>
          <NavLink to="/generate" className={menuLinkClass} onClick={closeMenu}>
            {t.generateLink}
          </NavLink>
          <NavLink to="/import" className={menuLinkClass} onClick={closeMenu}>
            {t.importLink}
          </NavLink>
          <NavLink to="/saved" className={menuLinkClass} onClick={closeMenu}>
            {t.savedLink}
          </NavLink>
        </nav>
      </div>

      <Link
        to="/settings"
        className={classes.settings}
        aria-label={t.settingsLink}
        title={t.settingsLink}
        onClick={closeMenu}
      >
        <svg
          className={classes.settingsIcon}
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </Link>
    </header>
  );
};

export default Header;
