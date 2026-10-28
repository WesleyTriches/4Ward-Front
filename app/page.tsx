import Header from "./components/Header";
import Contrast from "./components/home/Contrast";
import FeatureList from "./components/home/FeatureList";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main>
        <Contrast />
        <FeatureList />
      </main>
    </div>
  );
}
