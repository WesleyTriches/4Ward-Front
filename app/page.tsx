import Header from "./components/Header";
import ProductCard from "./components/product/ProductCard";

export default function Home() {
  return (
    <>
      <Header />
      <section className="py-2 text-center">
        <h3>Produtos em destaque</h3>
      </section>
      <section>
        <div className="container">
          <div className="row">
            <div className="col">
              <ProductCard />
            </div>
            <div className="col">
              <ProductCard />
            </div>
          </div>
          <div className="row">
            <div className="col">
              <ProductCard />
            </div>
            <div className="col">
              <ProductCard />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}