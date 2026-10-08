import { Features } from "../../types/home";
import FeatureItem from "./FeatureItem";

// benefícios da home: ficam numa lista para renderizar com .map
const features: Features[] = [
    { icon: "bi-calendar-check", title: "Agendamento online" },
    { icon: "bi-shield-check", title: "Profissionais verificados" },
    { icon: "bi-heart", title: "Mais saúde no seu dia a dia" },
];

export default function FeatureList() {
    return (
        <section id="como-funciona" className="py-5">
            <div className="container">
                <div className="row">
                    {features.map((feature) => (
                        <div key={feature.title} className="col-md-4">
                            <FeatureItem feature={feature} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
