import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PageNotFound.module.css';

const PageNotFound = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h1 className={styles.title}>404 - Page Not Found</h1>
        <p className={styles.message}>Sorry, the page you’re looking for doesn’t exist.</p>
        <Link to="/" className={styles.link}>
          Go back to home page
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
