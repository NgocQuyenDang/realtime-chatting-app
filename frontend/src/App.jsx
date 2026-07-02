import Login from "./Login";
import Register from "./Register.jsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import ChatWindow from "./ChatWindow.jsx";

function App() {
  return (
  <BrowserRouter>
    <Routes>

      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />


      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<ChatWindow />} />
    </Routes>
  </BrowserRouter>
  );
}

export default App;
