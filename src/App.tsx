import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import Registro from "./pages/Registro";
import VerificarCorreo from "./pages/VerificarCorreo";
import Dashboard from "./pages/Dashboard";
import NuevaPlaneacion from "./pages/NuevaPlaneacion";
import MisPlaneaciones from "./pages/MisPlaneaciones";
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
import PlaneacionDocumento from "./pages/PlaneacionDocumento";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
        return (
            <Routes>
                {/* Públicas */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verificar" element={<VerificarCorreo />} />

                {/* Privadas — requieren sesión */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/planeaciones" element={<ProtectedRoute><MisPlaneaciones /></ProtectedRoute>} />
                <Route path="/planeacion/nueva" element={<ProtectedRoute><NuevaPlaneacion /></ProtectedRoute>} />
                <Route path="/planeacion/:planeacionId" element={<ProtectedRoute><PlaneacionDocumento /></ProtectedRoute>} />
                <Route path="/planeacion/:planeacionId/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatGeneral /></ProtectedRoute>} />
                <Route path="/chat/:conversacionId" element={<ProtectedRoute><ChatGeneral /></ProtectedRoute>} />
                <Route path="/biblioteca" element={<ProtectedRoute><Biblioteca /></ProtectedRoute>} />
                <Route path="/comunidad" element={<ProtectedRoute><Comunidad /></ProtectedRoute>} />
                <Route path="/materiales" element={<ProtectedRoute><Materiales /></ProtectedRoute>} />
                <Route path="/recursos" element={<ProtectedRoute><Recursos /></ProtectedRoute>} />
                <Route path="/recursos/diapositivas" element={<ProtectedRoute><RecursoDiapositivas /></ProtectedRoute>} />
                <Route path="/recursos/cuestionarios" element={<ProtectedRoute><RecursoCuestionarios /></ProtectedRoute>} />
                <Route path="/recursos/mapas-mentales" element={<ProtectedRoute><RecursoMapasMentales /></ProtectedRoute>} />
                <Route path="/recursos/juegos" element={<ProtectedRoute><RecursoJuegos /></ProtectedRoute>} />
                <Route path="/recursos/juegos/memorama" element={<ProtectedRoute><JuegoMemorama /></ProtectedRoute>} />
                <Route path="/recursos/juegos/sopa-de-letras" element={<ProtectedRoute><JuegoSopaDeLetras /></ProtectedRoute>} />
                <Route path="/recursos/juegos/crucigrama" element={<ProtectedRoute><JuegoCrucigrama /></ProtectedRoute>} />
                <Route path="/recursos/juegos/ruleta" element={<ProtectedRoute><JuegoRuleta /></ProtectedRoute>} />
                <Route path="/recursos/juegos/ahorcado" element={<ProtectedRoute><JuegoAhorcado /></ProtectedRoute>} />
                <Route path="/recursos/juegos/verdadero-falso" element={<ProtectedRoute><JuegoVerdaderoFalso /></ProtectedRoute>} />
                <Route path="/recursos/carteles" element={<ProtectedRoute><RecursoCarteles /></ProtectedRoute>} />
                <Route path="/recursos/laboratorio" element={<ProtectedRoute><RecursoLaboratorio /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
}