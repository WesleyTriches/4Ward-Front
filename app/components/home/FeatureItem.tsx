import { Features } from "../../types/home";

type FeatureItemProps = {
    feature: Features;
};

export default function FeatureItem({ feature }: FeatureItemProps) {
    return (
        <div className="text-center">
            <i className={`bi ${feature.icon} fs-2`}></i>
            <h5 className="mt-2">{feature.title}</h5>
        </div>
    );
}
