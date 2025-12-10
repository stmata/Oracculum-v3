import React from 'react';
import MainLayout from '../../../../layouts/MainLayout';
import styles from './UploadTraitementPage.module.css';
import UploadTraitementComponent from '../../../../components/Oracculum/features/Compositus/UploadTraitement/UploadTraitement';

const UploadTraitementPage = () => {
  return (
    <MainLayout>
      <div className={styles.container}>
        <UploadTraitementComponent />
      </div>
    </MainLayout>
  );
};

export default UploadTraitementPage;
