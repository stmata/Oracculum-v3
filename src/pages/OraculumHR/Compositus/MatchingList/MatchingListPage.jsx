import React from 'react';
import MainLayout from '../../../../layouts/MainLayout';
import styles from './MatchingListPage.module.css';
import MatchingList from '../../../../components/Oracculum/features/Compositus/MatchingList/MatchingList';

const MatchingListPage = () => {
  return (
    <MainLayout>
      <div className={styles.container2}>
        <MatchingList />
      </div>
    </MainLayout>
  );
};

export default MatchingListPage;
