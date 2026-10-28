import { Features } from "../../types/home";
import FeatureItem from "./FeatureItem";
import styles from "./FeatureList.module.css";

// benefícios da home: ficam numa lista para renderizar com .map
const features: Features[] = [
    { icon: "bi-calendar-check", title: "Agendamento online" },
    { icon: "bi-shield-check", title: "Profissionais verificados" },
    { icon: "bi-heart", title: "Mais saúde no seu dia a dia" },
];

export default function FeatureList() {
    return (
        <section id="como-funciona" className={styles.section}>
            <ul className={styles.grid}>
                {features.map((feature) => (
                    <li key={feature.title}>
                        <FeatureItem feature={feature} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
