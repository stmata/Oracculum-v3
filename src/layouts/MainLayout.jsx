import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import styles from './MainLayout.module.css';

const MainLayout = ({ children }) => {
    return (
        <div className={styles.container}>
            <Navbar />
            <main className={styles.body}>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
