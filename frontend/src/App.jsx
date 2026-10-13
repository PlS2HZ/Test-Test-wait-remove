import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';


// Trainee Pages
import Assignments from './pages/trainee/Assignments';
import MyEvaluation from './pages/trainee/MyEvaluation';
import TraineeDashboard from './pages/trainee/TraineeDashboard';
import TrainingRoadmap from './pages/trainee/TrainingRoadmap';

// Trainer Pages
import EvaluateTask from './pages/trainer-ba/EvaluateTask';
import TaskRepository from './pages/trainer-ba/TaskRepository';
import TraineeManagement from './pages/trainer-ba/TraineeManagement';
import TrainerDashboard from './pages/trainer-ba/TrainerDashboard';

// HR Pages
import HrDashboard from './pages/hr/HrDashboard';
import ProbationReport from './pages/hr/ProbationReport';
import UserManagement from './pages/hr/UserManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Trainee Routes */}
        <Route path="/trainee/dashboard" element={<Layout><TraineeDashboard /></Layout>} />
        <Route path="/trainee/roadmap" element={<Layout><TrainingRoadmap /></Layout>} />
        <Route path="/trainee/assignments" element={<Layout><Assignments /></Layout>} />
        <Route path="/trainee/evaluations" element={<Layout><MyEvaluation /></Layout>} />

        {/* Trainer Routes */}
        <Route path="/trainer/dashboard" element={<Layout><TrainerDashboard /></Layout>} />
        <Route path="/trainer/trainees" element={<Layout><TraineeManagement /></Layout>} />
        <Route path="/trainer/evaluations" element={<Layout><EvaluateTask /></Layout>} />
        <Route path="/trainer/tasks" element={<Layout><TaskRepository /></Layout>} />

        {/* HR Routes */}
        <Route path="/hr/dashboard" element={<Layout><HrDashboard /></Layout>} />
        <Route path="/hr/users" element={<Layout><UserManagement /></Layout>} />
        <Route path="/hr/probation" element={<Layout><ProbationReport /></Layout>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}