import React from 'react';
import MainLayout from '../../../../layouts/MainLayout';
import styles from './Hr.module.css';
import FirstTimeDashboard from '../../../../components/Oracculum/features/Compositus/FirstTimeDashboard/FirstTimeDashboard';

const HrFirst = () => {
  return (
    <MainLayout>
      <div className={styles.container}>
        <FirstTimeDashboard />
      </div>
    </MainLayout>
  );
};

export default HrFirst;
