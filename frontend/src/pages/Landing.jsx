import { Leaf, Palette, Pizza, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import "./Landing.css";
import margherita from "../assets/margherita.png";
import pepperoni from "../assets/pepperoni.png";
import veggie from "../assets/veggie.png";

const popular = [
  { name: "Margherita Classic", price: 299, image: margherita },
  { name: "Pepperoni", price: 399, image: pepperoni },
  { name: "Garden Supreme", price: 349, image: veggie },
];

const Landing = () => (
  <main className="landing-page">
    <nav className="landing-nav">
      <Link to="/" className="landing-brand">
        <Pizza size={30} aria-hidden="true" /> Pizzara
      </Link>
      <div className="landing-actions">
        <Link to="/login" className="btn btn-secondary">
          Sign in
        </Link>
        <Link to="/register" className="btn btn-primary">
          Create account
        </Link>
      </div>
    </nav>
    <section className="landing-hero">
      <div className="landing-copy">
        <span className="landing-eyebrow">Crafted fresh, delivered hot</span>
        <h1>
          Your pizza.
          <br />
          <span>Your rules.</span>
        </h1>
        <p>
          Choose every layer, watch your creation come to life, and track it all
          the way to your door.
        </p>
        <div className="landing-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Build a pizza
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            View menu
          </Link>
        </div>
      </div>
      <div className="landing-showcase" aria-label="Pizzara custom pizza">
        <img
          className="landing-pizza"
          src={margherita}
          alt="Fresh margherita pizza"
          width="520"
          height="520"
          fetchPriority="high"
        />
        <div className="landing-float landing-float-one">Fresh ingredients</div>
        <div className="landing-float landing-float-two">Live tracking</div>
      </div>
    </section>

    <section className="landing-section">
      <div className="landing-section-heading">
        <span>Simple ordering</span>
        <h2>How Pizzara works</h2>
      </div>
      <div className="landing-three-grid">
        {[
          [
            "01",
            "Choose your pizza",
            "Pick a chef-made favorite or craft every layer yourself.",
          ],
          [
            "02",
            "Checkout securely",
            "Pay safely and add your delivery details in one clear step.",
          ],
          [
            "03",
            "Track your order",
            "Follow your pizza from the kitchen to your doorstep.",
          ],
        ].map(([number, title, text]) => (
          <article className="landing-info-card" key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="landing-section">
      <div className="landing-section-heading">
        <span>Chef favorites</span>
        <h2>Popular pizzas</h2>
      </div>
      <div className="landing-pizza-grid">
        {popular.map((pizza) => (
          <article className="landing-pizza-card" key={pizza.name}>
            <img src={pizza.image} alt={pizza.name} width="400" height="220" loading="lazy" decoding="async" />
            <div>
              <h3>{pizza.name}</h3>
              <strong>₹{pizza.price}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="landing-section landing-benefits">
      {[
        [
          Leaf,
          "Fresh ingredients",
          "Quality ingredients prepared for every order.",
        ],
        [Zap, "Fast delivery", "Clear preparation and live delivery updates."],
        [
          Palette,
          "Made your way",
          "Build a pizza with exactly the layers you love.",
        ],
      ].map(([Icon, title, text]) => (
        <article key={title}>
          <Icon size={30} aria-hidden="true" />
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </section>

    <section className="landing-section landing-testimonials">
      <div className="landing-section-heading">
        <span>Customer stories</span>
        <h2>Loved at first slice</h2>
      </div>
      <div className="landing-three-grid">
        {[
          ["“The pizza builder is incredibly easy to use.”", "Aarav"],
          ["“Delivery tracking was clear and the pizza arrived hot.”", "Meera"],
          ["“A polished experience with plenty of topping choices.”", "Kabir"],
        ].map(([quote, name]) => (
          <blockquote className="landing-info-card" key={name}>
            <p>{quote}</p>
            <strong>— {name}</strong>
          </blockquote>
        ))}
      </div>
    </section>

    <section className="landing-final-cta">
      <div>
        <span>Ready when you are</span>
        <h2>Build your perfect pizza</h2>
      </div>
      <Link to="/register" className="btn btn-primary btn-lg">
        Get started
      </Link>
    </section>
  </main>
);

export default Landing;
