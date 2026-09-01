import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import UploadMaterial from "./pages/UploadMaterial";
import Progress from "./pages/Progress";
import LearningPath from "./pages/LearningPath";
import TeachingVideo from "./pages/TeachingVideo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/learn" element={<Learn />} />

        <Route path="/upload" element={<UploadMaterial />} />

        <Route
  path="/teaching-video/:id"
  element={<TeachingVideo />}
/>

        <Route
  path="/learning-path"
  element={<LearningPath />}
/>

        <Route
  path="/lesson/:id"
  element={<Lesson />}
/>

        <Route
  path="/progress"
  element={<Progress />}
/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
