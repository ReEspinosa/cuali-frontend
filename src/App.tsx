import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import Registro from "./pages/Registro";
import VerificarCorreo from "./pages/VerificarCorreo";
import Dashboard from "./pages/Dashboard";
import NuevaPlaneacion from "./pages/NuevaPlaneacion";
import Chat from "./pages/Chat";
import Biblioteca from "./pages/Biblioteca";
import Comunidad from "./pages/Comunidad";
import Materiales from "./pages/Materiales";
import Recursos from "./pages/Recursos";
import Diapositivas from "./pages/Diapositivas";
import ChatGeneral from "./pages/ChatGeneral";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verificar" element={<VerificarCorreo />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/planeacion/nueva" element={<NuevaPlaneacion />} />
            <Route path="/planeacion/:planeacionId/chat" element={<Chat />} />
                <Route path="/chat" element={<ChatGeneral />} />
                <Route path="/chat/:conversacionId" element={<ChatGeneral />} />
            <Route path="/biblioteca" element={<Biblioteca />} />
            <Route path="/comunidad" element={<Comunidad />} />
            <Route path="/materiales" element={<Materiales />} />
            <Route path="/recursos" element={<Recursos />} />
            <Route path="/diapositivas" element={<Diapositivas />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}