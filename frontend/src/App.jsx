import Login from "./Login";
import Register from "./Register.jsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import HomePage from "./HomePage.jsx";

function App() {
  return (
  <BrowserRouter>
    <Routes>

      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />


      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<HomePage />} />
    </Routes>
  </BrowserRouter>
  );
}

export default App;
