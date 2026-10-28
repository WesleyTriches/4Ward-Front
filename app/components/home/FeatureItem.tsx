import { cx } from "../../lib/cx";
import { Features } from "../../types/home";
import styles from "./FeatureItem.module.css";

type FeatureItemProps = {
    feature: Features;
};

export default function FeatureItem({ feature }: FeatureItemProps) {
    return (
        <div className={styles.item}>
            <i className={cx("bi", feature.icon, styles.icon)} aria-hidden="true"></i>
            <h2 className={styles.title}>{feature.title}</h2>
        </div>
    );
}
