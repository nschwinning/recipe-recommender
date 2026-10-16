import { Fragment } from 'react';

import classes from './Header.module.css';

const Header = () => {
  return (
    <Fragment>
      <header className={classes.header}>
        <h1>AI Kitchen</h1>
        <span className={classes.badge}>Recipe of the Day</span>
      </header>
      <div className={classes['main-image']}>
        <div className={classes.hero} />
      </div>
    </Fragment>
  );
};

export default Header;
