import React, { useEffect, useState } from 'react';
import MainLayout from '../../../../layouts/MainLayout';
import styles from './Hr.module.css';
import FirstTimeDashboard from '../../../../components/Oracculum/features/Compositus/FirstTimeDashboard/FirstTimeDashboard';
import MainDashboard from '../../../../components/Oracculum/features/Compositus/MainDashboard/MainDashboard';

const Hr = () => {
  const [isFirstTime, setIsFirstTime] = useState(null); 

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user"));
    if (userData && typeof userData.first_use === 'boolean') {
      setIsFirstTime(userData.first_use);
    } else {
      setIsFirstTime(false);
    }
  }, []);

  return (
    <MainLayout>
      <div className={styles.container}>
        {isFirstTime === null && <p>Loading...</p>}
        {isFirstTime === true && <FirstTimeDashboard />}
        {isFirstTime === false && <MainDashboard />}
      </div>
    </MainLayout>
  );
};

export default Hr;
