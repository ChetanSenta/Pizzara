import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";
import { useCart } from "../../context/CartContext";
import { Check, ChevronDown, Pizza, ShoppingCart } from "lucide-react";
import { useToast } from "../../context/ToastContext";

// Import preconfigured pizza images
import margheritaImg from "../../assets/margherita.png";
import pepperoniImg from "../../assets/pepperoni.png";
import veggieImg from "../../assets/veggie.png";
import bbqChickenImg from "../../assets/bbq_chicken.jpeg";
import mexicanImg from "../../assets/mexican.png";
import fourCheeseImg from "../../assets/four-cheese.png";
import spicyPaneerImg from "../../assets/spicy-paneer.png";
import chickenTikkaImg from "../../assets/chicken-tikka.png";
import pestoGardenImg from "../../assets/pesto-garden.png";
import baconLoversImg from "../../assets/bacon-lovers.png";
import jainImg from "../../assets/jain.png";
import farmhouseImg from "../../assets/Farmhouse.png";

const preconfiguredPizzas = [
  {
    name: "Margherita Classic",
    image: margheritaImg,
    description:
      "The simple Italian classic with fresh basil and melted mozzarella.",
    price: 299,
    toppings: [
      "Thin Crust Base",
      "Marinara Sauce",
      "Mozzarella Cheese",
      "Tomatoes",
      "Basil",
    ],
    base: "Thin Crust",
    sauce: "Marinara",
    cheese: "Mozzarella",
    veggies: ["Tomatoes"],
    category: "veg",
  },
  {
    name: "Veggie Supreme",
    image: veggieImg,
    description:
      "Loaded with a colorful variety of fresh, crisp garden vegetables.",
    price: 349,
    toppings: [
      "Whole Wheat Base",
      "Pesto Sauce",
      "Parmesan Cheese",
      "Mushrooms",
      "Olives",
      "Tomatoes",
      "Bell Peppers",
    ],
    base: "Whole Wheat",
    sauce: "Pesto",
    cheese: "Parmesan",
    veggies: ["Mushrooms", "Olives", "Tomatoes", "Bell Peppers"],
    category: "veg",
  },
  {
    name: "BBQ Chicken Delight",
    image: bbqChickenImg,
    description: "Succulent chunks of chicken tossed in sweet barbecue sauce.",
    price: 429,
    toppings: [
      "Stuffed Crust Base",
      "BBQ Sauce",
      "Mozzarella Cheese",
      "Chicken",
      "Onions",
      "Jalapeños",
    ],
    base: "Stuffed Crust",
    sauce: "BBQ",
    cheese: "Mozzarella",
    veggies: ["Chicken", "Onions", "Jalapeños"],
    category: "nonveg",
  },
  {
    name: "Four Cheese Delight",
    image: fourCheeseImg,
    description: "Four rich cheeses baked over a classic tomato base.",
    price: 449,
    toppings: [
      "Thin Crust Base",
      "Alfredo Sauce",
      "Mozzarella Cheese",
      "Cheddar",
      "Parmesan",
      "Gouda",
    ],
    base: "Thin Crust",
    sauce: "Alfredo",
    cheese: "Mozzarella",
    veggies: [],
    category: "veg",
  },
  {
    name: "Spicy Paneer",
    image: spicyPaneerImg,
    description: "Bold spices, peppers and onions with plenty of tangy cheese.",
    price: 389,
    toppings: [
      "Whole Wheat Base",
      "Hot Sauce",
      "Cheddar Cheese",
      "Paneer",
      "Bell Peppers",
      "Onions",
    ],
    base: "Whole Wheat",
    sauce: "Hot Sauce",
    cheese: "Cheddar",
    veggies: ["Bell Peppers", "Onions"],
    category: "veg",
  },
  {
    name: "Chicken Tikka",
    image: chickenTikkaImg,
    description: "Smoky chicken tikka with onion, peppers and melted cheese.",
    price: 459,
    toppings: [
      "Stuffed Crust Base",
      "BBQ Sauce",
      "Mozzarella Cheese",
      "Chicken",
      "Bell Peppers",
      "Onions",
    ],
    base: "Stuffed Crust",
    sauce: "BBQ",
    cheese: "Mozzarella",
    veggies: ["Chicken", "Bell Peppers", "Onions"],
    category: "nonveg",
  },
  {
    name: "Mexican Heat",
    image: mexicanImg,
    description: "Corn, jalapeños and onions finished with a fiery sauce.",
    price: 369,
    toppings: [
      "Thin Crust Base",
      "Hot Sauce",
      "Cheddar Cheese",
      "Corn",
      "Jalapeños",
      "Onions",
    ],
    base: "Thin Crust",
    sauce: "Hot Sauce",
    cheese: "Cheddar",
    veggies: ["Corn", "Jalapeños", "Onions"],
    category: "veg",
  },
  {
    name: "Pesto Garden",
    image: pestoGardenImg,
    description: "Pesto, spinach and garden vegetables on a whole wheat base.",
    price: 399,
    toppings: [
      "Whole Wheat Base",
      "Pesto Sauce",
      "Parmesan Cheese",
      "Spinach",
      "Mushrooms",
      "Tomatoes",
    ],
    base: "Whole Wheat",
    sauce: "Pesto",
    cheese: "Parmesan",
    veggies: ["Spinach", "Mushrooms", "Tomatoes"],
    category: "veg",
  },
  {
    name: "Bacon Lovers",
    image: baconLoversImg,
    description: "Crispy bacon and sausage loaded over rich cheddar cheese.",
    price: 469,
    toppings: [
      "Thick Crust Base",
      "BBQ Sauce",
      "Cheddar Cheese",
      "Bacon",
      "Sausage",
    ],
    base: "Thick Crust",
    sauce: "BBQ",
    cheese: "Cheddar",
    veggies: ["Bacon", "Sausage"],
    category: "nonveg",
  },
  {
    name: "Classic Pepperoni",
    image: pepperoniImg,
    description: "Crispy pepperoni, mozzarella and our signature marinara.",
    price: 419,
    toppings: [
      "Thin Crust Base",
      "Marinara Sauce",
      "Mozzarella Cheese",
      "Pepperoni",
    ],
    base: "Thin Crust",
    sauce: "Marinara",
    cheese: "Mozzarella",
    veggies: ["Pepperoni"],
    category: "nonveg",
  },
  {
    name: "Jain Pizza",
    image: jainImg,
    description:
      "A Jain-friendly pizza with tomato, corn, bell peppers and olives.",
    price: 359,
    toppings: [
      "Thin Crust Base",
      "Marinara Sauce",
      "Mozzarella Cheese",
      "Corn",
      "Bell Peppers",
      "Olives",
    ],
    base: "Thin Crust",
    sauce: "Marinara",
    cheese: "Mozzarella",
    veggies: ["Corn", "Bell Peppers", "Olives"],
    category: "veg",
  },
  {
    name: "Farmhouse",
    image: farmhouseImg,
    description:
      "A hearty vegetarian pizza loaded with mushrooms, tomatoes and bell peppers.",
    price: 379,
    toppings: [
      "Thick Crust Base",
      "Marinara Sauce",
      "Mozzarella Cheese",
      "Mushrooms",
      "Tomatoes",
      "Bell Peppers",
    ],
    base: "Thick Crust",
    sauce: "Marinara",
    cheese: "Mozzarella",
    veggies: ["Mushrooms", "Tomatoes", "Bell Peppers"],
    category: "veg",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [addedPizza, setAddedPizza] = useState("");
  const [openToppings, setOpenToppings] = useState("");
  const [menuLoading, setMenuLoading] = useState(true);
  const sortRef = useRef(null);
  const sortTrigger = useRef(null);
  const visiblePizzas = useMemo(() => {
    const filtered =
      category === "all"
        ? [...preconfiguredPizzas]
        : preconfiguredPizzas.filter((pizza) => pizza.category === category);
    if (sort === "low") return filtered.sort((a, b) => a.price - b.price);
    if (sort === "high") return filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }, [category, sort]);

  useEffect(() => {
    setMenuLoading(true);
    const timer = window.setTimeout(() => setMenuLoading(false), 280);
    return () => window.clearTimeout(timer);
  }, [category, sort]);

  useEffect(() => {
    const closeSort = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target))
        setSortOpen(false);
    };
    document.addEventListener("mousedown", closeSort);
    return () => document.removeEventListener("mousedown", closeSort);
  }, []);

  useEffect(() => {
    if (sortOpen) sortRef.current?.querySelector('[aria-selected="true"]')?.focus();
  }, [sortOpen]);

  const handleSortKeyDown = (event) => {
    if (event.key === "Escape" && sortOpen) {
      event.preventDefault();
      sortTrigger.current?.focus();
      setSortOpen(false);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!sortOpen) {
      setSortOpen(true);
      return;
    }
    const options = Array.from(sortRef.current.querySelectorAll('[role="option"]'));
    const currentIndex = options.indexOf(document.activeElement);
    const nextIndex = currentIndex + (event.key === "ArrowDown" ? 1 : -1);
    options[Math.max(0, Math.min(options.length - 1, nextIndex))]?.focus();
  };

  const sortLabels = {
    featured: "Featured First",
    low: "Price: Low to High",
    high: "Price: High to Low",
  };
  const handleAddPizza = (pizza) => {
    addItem({
      name: pizza.name,
      price: pizza.price,
      image: pizza.image,
      pizza: {
        base: pizza.base || "Thin Crust",
        sauce: pizza.sauce || "Marinara",
        cheese: pizza.cheese || "Mozzarella",
        veggies: Array.isArray(pizza.veggies) ? pizza.veggies : [],
      },
    });
    setAddedPizza(pizza.name);
    toast.success(`${pizza.name} added to cart`);
    window.setTimeout(() => setAddedPizza(""), 1500);
  };

  return (
    <div className="dashboard page container" style={{ paddingTop: "100px" }}>
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <h1>
            Welcome, <span>{user?.name}</span>!
          </h1>
          <p>Choose from our freshly prepared house favorites</p>
        </div>
        <Pizza className="dashboard-hero-pizza" size={96} aria-hidden="true" />
      </div>

      <div className="our-pizzas-section animate-fade">
        <div className="our-pizzas-heading">
          <h2>Our Pizzas</h2>
          <Link to="/build-pizza" className="btn btn-primary">
            Build Your Pizza
          </Link>
        </div>
        <div
          className="pizza-filter-toolbar"
          aria-label="Filter and sort pizzas"
        >
          <div className="pizza-category-chips">
            {[
              ["all", "All"],
              ["veg", "Vegetarian"],
              ["nonveg", "Non-Veg"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={
                  category === value
                    ? "pizza-filter-chip active"
                    : "pizza-filter-chip"
                }
                onClick={() => setCategory(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="pizza-sort"
            ref={sortRef}
            onKeyDown={handleSortKeyDown}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSortOpen(false);
            }}
          >
            <span id="pizza-sort-label" className="pizza-sort-label">Sort</span>
            <div className="pizza-sort-control">
              <button
                type="button"
                ref={sortTrigger}
                className="pizza-sort-button"
                aria-labelledby="pizza-sort-label pizza-sort-value"
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                aria-controls={sortOpen ? "pizza-sort-menu" : undefined}
                onClick={() => setSortOpen((open) => !open)}
              >
                <span id="pizza-sort-value">{sortLabels[sort]}</span>
                <ChevronDown className="pizza-sort-arrow" size={18} aria-hidden="true" />
              </button>
              {sortOpen && (
                <div id="pizza-sort-menu" className="pizza-sort-menu" role="listbox" aria-labelledby="pizza-sort-label">
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      role="option"
                      tabIndex={-1}
                      aria-selected={sort === value}
                      className={sort === value ? "active" : ""}
                      onClick={() => {
                        setSort(value);
                        sortTrigger.current?.focus();
                        setSortOpen(false);
                      }}
                    >
                      {label}
                      {sort === value && <Check size={16} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pizza-result-count" aria-live="polite">
          <span>{visiblePizzas.length}</span>{' '}pizza{visiblePizzas.length === 1 ? "" : "s"}
        </div>
        {menuLoading ? (
          <div className="our-pizzas-grid" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="our-pizza-card menu-skeleton-card" key={index}>
                <div className="menu-skeleton-img" />
                <div className="our-pizza-info">
                  <div className="menu-skeleton-line wide" />
                  <div className="menu-skeleton-line" />
                  <div className="menu-skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        ) : visiblePizzas.length === 0 ? (
          <div className="menu-empty-state">
            <Pizza size={48} strokeWidth={1.4} aria-hidden="true" />
            <h3>No pizzas found</h3>
            <p>Try another category or show all pizzas.</p>
            <button className="btn btn-secondary" onClick={() => setCategory("all")}>
              Show all pizzas
            </button>
          </div>
        ) : (
          <div className="our-pizzas-grid">
            {visiblePizzas.map((pizza, index) => {
              const toppings = Array.isArray(pizza.toppings) ? pizza.toppings : [];
              const visibleToppings = toppings.slice(0, 3);
              const remainingToppings = toppings.slice(3);
              const toppingsOpen = openToppings === pizza.name;
              return (
                <div className="our-pizza-card" key={pizza.name}>
                  <div className="our-pizza-img-container">
                    <img
                      src={pizza.image}
                      alt={pizza.name}
                      className="our-pizza-img"
                      loading={index < 4 ? "eager" : "lazy"}
                      decoding={index < 4 ? undefined : "async"}
                      width="260"
                      height="190"
                      onLoad={(event) => event.currentTarget.classList.add("loaded")}
                    />
                  </div>
                  <div className="our-pizza-info">
                    <h3 className="pizza-card-title">
                      <span className={`pizza-category-dot ${pizza.category}`} aria-label={pizza.category === "veg" ? "Vegetarian" : "Non-vegetarian"} />
                      {pizza.name}
                    </h3>
                    <div className="our-pizza-price-section">
                      <span className="our-pizza-price">₹{pizza.price}</span>
                    </div>
                    <p className="our-pizza-desc">{pizza.description}</p>
                    <div className="our-pizza-toppings-title">
                      Toppings & Custom Base/Sauce:
                    </div>
                    <div className="our-pizza-toppings">
                      {visibleToppings.map((t, idx) => (
                        <span className="topping-tag" key={idx}>{t}</span>
                      ))}
                      {remainingToppings.length > 0 && (
                        <span
                          className="topping-more-wrap"
                        >
                          <button
                            type="button"
                            className="topping-more"
                            aria-expanded={toppingsOpen}
                            aria-label={`Show ${remainingToppings.length} more toppings for ${pizza.name}`}
                            onKeyDown={(event) => { if (event.key === "Escape") setOpenToppings(""); }}
                            onBlur={() => setOpenToppings("")}
                            onClick={() => setOpenToppings(toppingsOpen ? "" : pizza.name)}
                          >
                            +{remainingToppings.length} more
                          </button>
                          {toppingsOpen && (
                            <span className="topping-popover">
                              {remainingToppings.map((t) => (
                                <span key={t}>{t}</span>
                              ))}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="our-pizza-actions">
                      <button
                        className={`btn btn-secondary pizza-add-button${addedPizza === pizza.name ? " added" : ""}`}
                        onClick={() => handleAddPizza(pizza)}
                      >
                        {addedPizza === pizza.name ? <Check size={17} aria-hidden="true" /> : <ShoppingCart size={17} aria-hidden="true" />}
                        {addedPizza === pizza.name ? "Added ✓" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
