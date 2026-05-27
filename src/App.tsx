import './App.css'
import {  Suspense } from "react";
import { Spin } from "antd";
import { Route, Routes} from "react-router-dom"; 
import HomePage from './components/Home/Home';
import LoginPage from './components/Login/Login';
import DashboardPage from './components/Overview/Overview';
import Sidebar from './components/Sidebar/Sidebar';
import Analytics from './components/Analytics/Analytics';
import Stales from './components/stales/stales';
import Damages from './components/Damages/Damages';
import ReportsPage from './components/Reports/ReportsPage';

function App() {

  return(
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Spin size="large" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<Sidebar />}>
          <Route path='/Home' element={<HomePage />} />
          <Route path='/overview' element={<DashboardPage />} />
          <Route path='/analytics' element={<Analytics />} />
          <Route path='/stales' element={<Stales />} />
          <Route path='/damages' element={<Damages />} />
          <Route path='/reports' element={<ReportsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;