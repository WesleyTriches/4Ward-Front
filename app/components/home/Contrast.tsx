import styles from "./Contrast.module.css";
import SearchBar from "./SearchBar";

export default function Contrast() {
    return (
        <section className={styles.hero}>
            <div className={styles.content}>
                <h1 className={styles.title}>
                    Movimento para<br />
                    uma vida <span className={styles.highlight}>melhor.</span>
                </h1>

                <p className={styles.subtitle}>
                    Encontre fisioterapeutas qualificados perto de você
                    e agende sua consulta de forma rápida e segura.
                </p>

                <SearchBar />
            </div>
        </section>
    );
}
