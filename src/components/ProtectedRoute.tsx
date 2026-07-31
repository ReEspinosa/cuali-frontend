import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../lib/api";

/**
 * Envuelve rutas privadas. Si no hay token de sesión, redirige a /login.
 * Guarda la ruta a la que intentaba entrar (en `state.from`) para poder
 * regresar ahí después de iniciar sesión, si se quiere.
 *
 * OJO: esto es solo protección de UI (evita mostrar pantallas privadas sin
 * sesión). La protección REAL de datos vive en el backend, donde cada
 * endpoint valida el token con Depends(get_current_user). Nunca confíes solo
 * en este componente para seguridad.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = getToken();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
}