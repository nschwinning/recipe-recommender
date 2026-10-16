import type { ReactNode } from 'react';

import classes from './Card.module.css';

const Card = (props: { children: ReactNode }) => {
  return <div className={classes.card}>{props.children}</div>;
};

export default Card;
