import Header from "./components/Header";
import Contrast from "./components/home/Contrast";
import FeatureList from "./components/home/FeatureList";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Contrast />
        <FeatureList />
      </main>
    </>
  );
}