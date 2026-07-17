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
import RecursoDiapositivas from "./pages/recursos/Diapositivas";
import RecursoCuestionarios from "./pages/recursos/Cuestionarios";
import RecursoMapasMentales from "./pages/recursos/MapasMentales";
import RecursoJuegos from "./pages/recursos/Juegos";
import JuegoMemorama from "./pages/recursos/juegos/Memorama";
import JuegoSopaDeLetras from "./pages/recursos/juegos/SopaDeLetras";
import JuegoCrucigrama from "./pages/recursos/juegos/Crucigrama";
import JuegoRuleta from "./pages/recursos/juegos/Ruleta";
import JuegoAhorcado from "./pages/recursos/juegos/Ahorcado";
import JuegoVerdaderoFalso from "./pages/recursos/juegos/VerdaderoFalso";
import RecursoCarteles from "./pages/recursos/Carteles";
import RecursoLaboratorio from "./pages/recursos/Laboratorio";
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
                    <Route path="/recursos/diapositivas" element={<RecursoDiapositivas />} />
                    <Route path="/recursos/cuestionarios" element={<RecursoCuestionarios />} />
                    <Route path="/recursos/mapas-mentales" element={<RecursoMapasMentales />} />
                    <Route path="/recursos/juegos" element={<RecursoJuegos />} />
                    <Route path="/recursos/juegos/memorama" element={<JuegoMemorama />} />
                    <Route path="/recursos/juegos/sopa-de-letras" element={<JuegoSopaDeLetras />} />
                    <Route path="/recursos/juegos/crucigrama" element={<JuegoCrucigrama />} />
                    <Route path="/recursos/juegos/ruleta" element={<JuegoRuleta />} />
                    <Route path="/recursos/juegos/ahorcado" element={<JuegoAhorcado />} />
                    <Route path="/recursos/juegos/verdadero-falso" element={<JuegoVerdaderoFalso />} />
                    <Route path="/recursos/carteles" element={<RecursoCarteles />} />
                    <Route path="/recursos/laboratorio" element={<RecursoLaboratorio />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
}