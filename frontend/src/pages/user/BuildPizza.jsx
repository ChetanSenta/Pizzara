import { optimizeImage } from '../../utils/optimizeImage';
import { checkoutTotals } from '../../utils/checkout';
import { useState, useEffect } from 'react';
import { Check, Pizza } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBases, getSauces, getCheeses, getVeggies, getMeats } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';
import PageSkeleton from '../../components/PageSkeleton';
import './BuildPizza.css';

const steps = [
  { key: 'base', label: 'Base', icon: '' },
  { key: 'sauce', label: 'Sauce', icon: '' },
  { key: 'cheese', label: 'Cheese', icon: '' },
  { key: 'veggies', label: 'Toppings', icon: '' },
  { key: 'review', label: 'Review', icon: '' },
];

const hideFailedLayer = (event) => {
  event.currentTarget.hidden = true;
};

const PizzaPreview = ({ selection, toppingOptions, total }) => {
  const hasBase = Boolean(selection.base);
  const toppingCount = selection.veggies.length;
  const CLOUDINARY_BASE = "https://res.cloudinary.com/ddn1qjenm/image/upload/pizzonex/builder";
  
  const format = (name) => {
    if (!name) return '';
    const lowercase = name.toLowerCase().trim();
    if (lowercase === 'bbq') return 'bbq-sauce';
    if (lowercase === 'hot sauce') return 'buffalo';
    if (lowercase === 'gouda') return 'cheddar';
    if (lowercase === 'vegan cheese') return 'mozzarella';
    return lowercase.replace(/\s+/g, '-');
  };

  const base = selection.base ? [selection.base.name] : [];
  const sauce = selection.sauce ? [selection.sauce.name] : [];
  const cheese = selection.cheese ? [selection.cheese.name] : [];
  
  // Separate veggies and meats safely
  const veggies = selection.veggies.filter(v => v.category !== 'meat');
  const meats = selection.veggies.filter(v => v.category === 'meat');

  const toppingOrder = new Map(toppingOptions.map((topping, index) => [topping._id, index]));
  const displayToppings = [...selection.veggies].sort((first, second) =>
    (toppingOrder.get(first._id) ?? toppingOptions.length)
    - (toppingOrder.get(second._id) ?? toppingOptions.length)
  );

  return (
    <div className="pizza-preview-card">
      <div className={`pizza-preview-canvas-container${hasBase ? ' has-base' : ''}`}>
        {/* Base Layer */}
        {base[0] && (
          <img
            key={base[0]}
            src={optimizeImage(`${CLOUDINARY_BASE}/bases/${format(base[0])}.png`, 400)}
            alt="Base"
            width={150}
            height={150}
            onError={hideFailedLayer}
            className="pizza-layer-img pizza-layer-base animate-layer-entry"
          />
        )}

        {/* Sauce Layer */}
        {sauce[0] && (
          <img
            key={sauce[0]}
            src={optimizeImage(`${CLOUDINARY_BASE}/sauces/${format(sauce[0])}.png`, 400)}
            alt="Sauce"
            width={150}
            height={150}
            onError={hideFailedLayer}
            className="pizza-layer-img pizza-layer-sauce"
          />
        )}

        {/* Cheese Layer */}
        {cheese[0] && (
          <img
            key={cheese[0]}
            src={optimizeImage(`${CLOUDINARY_BASE}/cheese/${format(cheese[0])}.png`, 400)}
            alt="Cheese"
            width={150}
            height={150}
            onError={hideFailedLayer}
            className="pizza-layer-img pizza-layer-cheese"
          />
        )}

        {/* Veggies */}
        {veggies.map((veg) => {
          if (veg.name.toLowerCase().trim() === 'corn') return null;
          return (
            <img
              key={veg._id}
              src={optimizeImage(`${CLOUDINARY_BASE}/veggies/${format(veg.name)}.png`, 400)}
              alt={veg.name}
              width={150}
              height={150}
              onError={hideFailedLayer}
              className="pizza-layer-img pizza-layer-topping"
            />
          );
        })}

        {/* Meats */}
        {meats.map((m) => (
          <img
            key={m._id}
            src={optimizeImage(`${CLOUDINARY_BASE}/meat/${format(m.name)}.png`, 400)}
            alt={m.name}
            width={150}
            height={150}
            onError={hideFailedLayer}
            className="pizza-layer-img pizza-layer-topping"
          />
        ))}

        {!hasBase && (
          <div className="pizza-preview-empty">
            <Pizza size={52} strokeWidth={1.4} aria-hidden="true" />
            <p>Choose crust base to start crafting</p>
          </div>
        )}
      </div>

      <div className="pizza-visual-legend">
        <div className="legend-title">Crafting Details</div>
        {[
          ['Base', selection.base],
          ['Sauce', selection.sauce],
          ['Cheese', selection.cheese],
        ].map(([label, item]) => (
          <div className="legend-row" key={label}>
            <span className="legend-label">{label}</span>
            <span className={`legend-name${item ? '' : ' legend-empty'}`} title={item?.name}>
              {item ? item.name : 'None Selected'}
            </span>
            <span className="legend-price">{item && `₹${item.price}`}</span>
          </div>
        ))}
        <div className="legend-row legend-row-toppings">
          <span className={`legend-label${toppingCount ? ' legend-toppings-heading' : ''}`}>
            Toppings
            {toppingCount > 0 && <span className="legend-topping-count">{toppingCount}</span>}
          </span>
          {toppingCount === 0 && <span className="legend-name legend-empty">None Selected</span>}
        </div>
        {toppingCount > 0 && (
          <div className={`legend-topping-list${toppingCount > 6 ? ' is-scrollable' : ''}`}>
            {displayToppings.map((topping) => (
              <div className="legend-row legend-topping" key={topping._id}>
                <span className="legend-name" title={topping.name}>{topping.name}</span>
                <span className="legend-price">₹{topping.price}</span>
              </div>
            ))}
          </div>
        )}
        <div className="legend-total">
          <span>Running total</span>
          <strong>₹{total}</strong>
        </div>
      </div>
    </div>
  );
};

const BuildPizza = () => {
  const toast = useToast();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [options, setOptions] = useState({ bases: [], sauces: [], cheeses: [], veggies: [], meats: [] });
  const [selection, setSelection] = useState({ base: null, sauce: null, cheese: null, veggies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [b, s, c, v, m] = await Promise.all([getBases(), getSauces(), getCheeses(), getVeggies(), getMeats()]);
        setOptions({ bases: b.data, sauces: s.data, cheeses: c.data, veggies: [...v.data, ...m.data], meats: m.data });
      } catch (err) {
        toast.error('Failed to load options');
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const handleSelect = (key, item) => {
    if (key === 'veggies') {
      setSelection((prev) => {
        const exists = prev.veggies.find((v) => v._id === item._id);
        return {
          ...prev,
          veggies: exists ? prev.veggies.filter((v) => v._id !== item._id) : [...prev.veggies, item],
        };
      });
    } else {
      setSelection((prev) => ({ ...prev, [key]: item }));
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return selection.base;
    if (currentStep === 1) return selection.sauce;
    if (currentStep === 2) return selection.cheese;
    return true;
  };

  const nextHint = () => {
    if (currentStep === 0) return 'Select a base to continue';
    if (currentStep === 1) return 'Select a sauce to continue';
    if (currentStep === 2) return 'Select cheese to continue';
    return '';
  };

  const totalPrice = () => {
    let total = 0;
    if (selection.base) total += selection.base.price;
    if (selection.sauce) total += selection.sauce.price;
    if (selection.cheese) total += selection.cheese.price;
    selection.veggies.forEach((v) => (total += v.price));
    return total;
  };

  const customPizzaCharge = 49;
  const unitPrice = Math.round(totalPrice()) + customPizzaCharge;
  const { deliveryFee: deliveryCharge, taxes: taxAmount, total: grandTotal } =
    checkoutTotals([{ unitPrice, quantity: 1 }]);

  const handleCheckout = () => {
    // Validate all required fields are selected
    if (!selection.base) {
      toast.error('Please select a base');
      return;
    }
    if (!selection.sauce) {
      toast.error('Please select a sauce');
      return;
    }
    if (!selection.cheese) {
      toast.error('Please select cheese');
      return;
    }

    const pizzaData = {
      base: selection.base.name,
      sauce: selection.sauce.name,
      cheese: selection.cheese.name,
      veggies: selection.veggies.map((v) => v.name),
    };
    const items = [{ name: 'Custom Pizza', type: 'custom', pizza: pizzaData, quantity: 1, unitPrice }];
    navigate('/checkout', { state: { items, priceBreakdown: checkoutTotals(items) } });
  };

  const handleAddToCart = () => {
    if (!selection.base || !selection.sauce || !selection.cheese) {
      toast.error('Complete the pizza before adding it to the cart');
      return;
    }
    const pizzaData = {
      base: selection.base.name,
      sauce: selection.sauce.name,
      cheese: selection.cheese.name,
      veggies: selection.veggies.map((item) => item.name),
    };
    const configKey = [
      'custom',
      pizzaData.base,
      pizzaData.sauce,
      pizzaData.cheese,
      ...[...pizzaData.veggies].sort(),
    ].join('|').toLowerCase();
    addItem({
      id: configKey,
      name: 'Custom Pizza',
      price: unitPrice,
      pizza: pizzaData,
      isCustomPizza: true,
      customPizzaCharge,
      priceBreakdown: {
        pizza: totalPrice(),
        customPizzaCharge,
      },
    });
    toast.success('Custom pizza added to cart');
  };

  const renderOptions = (key, items) => (
    <div className="options-grid" style={{ '--option-columns': items.length > 5 ? 4 : Math.max(1, items.length) }}>
      {items.map((item) => {
        const isSelected = key === 'veggies'
          ? selection.veggies.some((v) => v._id === item._id)
          : selection[key]?._id === item._id;
        return (
          <div
            key={item._id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${item.name}, ₹${item.price}${isSelected ? ', selected' : ''}`}
            className={`option-card ${isSelected ? (key === 'veggies' ? 'selected-multi' : 'selected') : ''}`}
            onClick={() => handleSelect(key, item)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleSelect(key, item);
              }
            }}
          >
            <div className="option-icon">{item.image}</div>
            <div className="option-name">{item.name}</div>
            <div className="option-price">₹{item.price}</div>
          </div>
        );
      })}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (<div className="step-content"><h2 className="step-title">Choose Your Pizza Base</h2>{renderOptions('base', options.bases)}</div>);
      case 1:
        return (<div className="step-content"><h2 className="step-title">Pick Your Sauce</h2>{renderOptions('sauce', options.sauces)}</div>);
      case 2:
        return (<div className="step-content"><h2 className="step-title">Select Your Cheese</h2>{renderOptions('cheese', options.cheeses)}</div>);
      case 3:
        return (
          <div className="step-content">
            <div className="step-title-row">
              <h2 className="step-title">Add Toppings (Veggies & Meat)</h2>
              <span className="selection-count" aria-live="polite">{selection.veggies.length} selected</span>
            </div>
            {renderOptions('veggies', options.veggies)}
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            <h2 className="step-title">Review Your Pizza</h2>
            <div className="review-card">
              <div className="review-item"><span className="review-label">Base</span><span className="review-value">{selection.base?.image} {selection.base?.name} <small>₹{selection.base?.price}</small></span><button type="button" className="review-edit" onClick={() => setCurrentStep(0)}>Edit</button></div>
              <div className="review-item"><span className="review-label">Sauce</span><span className="review-value">{selection.sauce?.image} {selection.sauce?.name} <small>₹{selection.sauce?.price}</small></span><button type="button" className="review-edit" onClick={() => setCurrentStep(1)}>Edit</button></div>
              <div className="review-item"><span className="review-label">Cheese</span><span className="review-value">{selection.cheese?.image} {selection.cheese?.name} <small>₹{selection.cheese?.price}</small></span><button type="button" className="review-edit" onClick={() => setCurrentStep(2)}>Edit</button></div>
              <div className="review-item">
                <span className="review-label">Toppings</span>
                <div className="veggies-list">
                  {selection.veggies.length === 0 ? <span style={{color:'var(--text-secondary)'}}>None</span> : selection.veggies.map((v) => <span key={v._id} className="veggie-pill">{v.image} {v.name} <small>₹{v.price}</small></span>)}
                </div>
                <button type="button" className="review-edit" onClick={() => setCurrentStep(3)}>Edit</button>
              </div>
              <div className="review-total"><span>Total</span><span>₹{totalPrice()}</span></div>
              <div className="review-charge"><span>Custom pizza charge</span><span>₹{customPizzaCharge}</span></div>
              <div className="review-charge"><span>Delivery charge</span><span>₹{deliveryCharge}</span></div>
              <div className="review-charge"><span>Taxes (5%)</span><span>₹{taxAmount}</span></div>
              <div className="review-total review-grand-total"><span>Grand Total</span><span>₹{grandTotal}</span></div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (loading) return <PageSkeleton cards={4} />;

  return (
    <div className="build-pizza page container" style={{ paddingTop: '100px' }}>
      <div className="build-header">
        <h1>Build Your <span>Custom Pizza</span></h1>
      </div>

      <div className="progress-bar">
        {steps.map((step, i) => (
          <button
            type="button"
            key={step.key}
            className={`progress-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
            onClick={() => i <= currentStep && setCurrentStep(i)}
            disabled={i > currentStep}
            aria-current={i === currentStep ? 'step' : undefined}
            aria-label={`Step ${i + 1}: ${step.label}${i < currentStep ? ' (completed)' : i === currentStep ? ' (current)' : ''}`}
            title={i < currentStep ? `Go back to ${step.label}` : undefined}
          >
            <span className="progress-step-num">{i < currentStep ? <Check size={15} aria-hidden="true" /> : i + 1}</span>
            <span>{step.icon} {step.label}</span>
          </button>
        ))}
      </div>

      <div className="builder-layout-grid">
        {/* Left column: dynamic layered preview */}
        <div className="builder-preview-column">
          <PizzaPreview selection={selection} toppingOptions={options.veggies} total={totalPrice()} />
        </div>

        {/* Right column: controls */}
        <div className="builder-controls-column">
          {renderStep()}

          <div className={`builder-action-bar${currentStep < 3 ? ' builder-action-bar-short' : ''}`}>
            <div className="builder-action-total">
              <span>Running total</span>
              <strong>₹{totalPrice()}</strong>
            </div>
            <div className={`step-nav${currentStep === 4 ? ' step-nav-review' : ''}`}>
              {currentStep > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep((p) => p - 1)}
                  aria-label="Go back to the previous step"
                >
                  ← Back
                </button>
              )}
              {currentStep < 4 && !canProceed() && (
                <p className="step-next-hint" id="step-next-hint">{nextHint()}</p>
              )}
              {currentStep < 4 ? (
                <button
                  type="button"
                  className="btn btn-primary step-next"
                  disabled={!canProceed()}
                  title={!canProceed() ? nextHint() : undefined}
                  aria-describedby={!canProceed() ? 'step-next-hint' : undefined}
                  onClick={() => setCurrentStep((p) => p + 1)}
                >
                  Next →
                </button>
              ) : (
                <div className="step-review-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddToCart}
                    disabled={!selection.base || !selection.sauce || !selection.cheese}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleCheckout}
                    disabled={!selection.base || !selection.sauce || !selection.cheese}
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildPizza;
