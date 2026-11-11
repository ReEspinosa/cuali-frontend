import { Link } from "react-router-dom";
import PaginaCuaderno from "../components/PaginaCuaderno";

export default function Materiales() {
    return (
        <PaginaCuaderno>
            <h1 className="titulo-condensado text-5xl">
                Mis <span className="marcatexto">materiales</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-tinta-suave">
                Aquí van a quedar guardados los recursos que generes con Cuali. Estamos terminando esta sección.
            </p>
            <p className="mt-6 text-tinta-suave">
                Puedes crear uno desde{" "}
                <Link to="/recursos" className="font-bold underline">
                    Recursos
                </Link>
                .
            </p>
        </PaginaCuaderno>
    );
}
