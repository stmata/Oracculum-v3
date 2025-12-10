import React from "react";
import { Routes, Route } from "react-router-dom";
import Authentification from "../components/Oracculum/Authentification/Authentification";
import APIs from "../pages/OraculumHR/APIs/APIs";
import PageNotFound from "../pages/PageNotFound/PageNotFound";
import PrivateRoute from "./PrivateRoute";
import OraculumChoice from "../pages/OraculumChoice/OraculumChoice";
import Fidelex from "../pages/OraculumHR/Fidelex/Fidelex";
import Minerva from "../pages/OraculumHR/Minerva/Minerva";
import UploadTraitementPage from "../pages/OraculumHR/Compositus/UploadTraitement/UploadTraitementPage";
import MatchingList from "../pages/OraculumHR/Compositus/MatchingList/MatchingListPage";
import HrFirst from "../pages/OraculumHR/Compositus/HrFirst/HrFirst";
import HistoryPage from "../components/Oracculum/features/Compositus/MainDashboard/TreatmentOverviewSection/Features/HistoryPage/HistoryPage";
import StatsPage from "../components/Oracculum/features/Compositus/MainDashboard/TreatmentOverviewSection/Features/StatsPage/StatsPage";
import ReportsPage from "../components/Oracculum/features/Compositus/MainDashboard/TreatmentOverviewSection/Features/ReportsPage/ReportsPage";
import MainLayout from "../layouts/MainLayout";
import ManageExternalPage from "../components/Oracculum/features/Compositus/MainDashboard/CandidatesDashboard/Features/ManageExternalPage/ManageExternalPage";
import EditInternalPage from "../components/Oracculum/features/Compositus/MainDashboard/CandidatesDashboard/Features/EditInternalPage/EditInternalPage";
import CandidatesListPage from "../components/Oracculum/features/Compositus/MainDashboard/CandidatesDashboard/Features/CandidatesListPage/CandidatesListPage";
import HR from "../pages/OraculumHR/Compositus/HR/Hr";

const ProtectedRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Authentification />} />

      <Route
        path="/oraculum"
        element={<PrivateRoute element={<OraculumChoice />} />}
      />

      <Route
        path="/oraculum/apis"
        element={
          <PrivateRoute
            element={<APIs />}
          />
        }
      />

      <Route
        path="/oraculum/minerva"
        element={
          <PrivateRoute
            element={<Minerva />}
          />
        }
      />

      <Route
        path="/oraculum/fidelex"
        element={
          <PrivateRoute
            element={<Fidelex />}
          />
        }
      />
      <Route
        path="/oraculum/compositus"
        element={
          <PrivateRoute
            element={<HR />}
          />
        }
      />

      <Route
        path="/hrfirst"
        element={
          <PrivateRoute
            element={<HrFirst />}
          />
        }
      />

      <Route
        path="/upload"
        element={
          <PrivateRoute
            element={<UploadTraitementPage />}
          />
        }
      />

      <Route
        path="/matching-list"
        element={
          <PrivateRoute
            element={<MatchingList />}
          />
        }
      />

     

      <Route
        path="/analysis/202"
        element={
          <PrivateRoute
            element={<MainLayout>
              <HistoryPage />
            </MainLayout>}
          />
        }
      />

      <Route
        path="/analysis/303"
        element={
          <PrivateRoute
            element={<MainLayout>
              <StatsPage />
            </MainLayout>}
          />
        }
      />

      <Route
        path="/analysis/404"
        element={
          <PrivateRoute
            element={<MainLayout>
              <ReportsPage />
            </MainLayout>}
          />
        }
      />

      <Route
        path="/candidates/101"
        element={
          <PrivateRoute
            element={<MainLayout>
              <CandidatesListPage />
            </MainLayout>}
          />
        }
      />

      <Route
        path="/candidates/202"
        element={
          <PrivateRoute
            element={<MainLayout>
              <EditInternalPage />
            </MainLayout>}
          />
        }
      />

      <Route
        path="/candidates/303"
        element={
          <PrivateRoute
            element={<MainLayout>
              <ManageExternalPage />
            </MainLayout>}
          />
        }
      />
      < Route path="*" element={< PageNotFound />} />
    </Routes >
  );
};

export default ProtectedRoutes;