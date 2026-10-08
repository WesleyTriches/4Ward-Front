import SearchBar from "./SearchBar";

export default function Contrast() {
    return (
        <section className="container py-5">
            <h1 className="mb-3">Movimento para uma vida melhor.</h1>

            <p className="mb-4">
                Encontre fisioterapeutas qualificados perto de você
                e agende sua consulta de forma rápida e segura.
            </p>

            <SearchBar />
        </section>
    );
}
