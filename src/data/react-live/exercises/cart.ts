import { INDEX_FILE, TESTBED_FILE, stylesFile } from "../../live/shared";
import type { ReactExercise } from "../../live/types";

const CART_CSS = `.products {
  margin-bottom: 14px;
  border-top: 1px solid #e4e4e7;
}
.product {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #f4f4f5;
}
.product .name { flex: 1; font-weight: 500; }
.product .price { color: #71717a; font-variant-numeric: tabular-nums; }
.product button {
  padding: 5px 11px;
  border: 1px solid #d4d4d8;
  border-radius: 8px;
  background: #fafafa;
  font-size: 12.5px;
}
.cart h3 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #71717a;
}
.cart-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dashed #e4e4e7;
  font-size: 13.5px;
}
.cart-row .qty { color: #52525b; font-variant-numeric: tabular-nums; }
.cart-row button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: #b91c1c;
  font-size: 12px;
  padding: 2px 6px;
}
.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.clear {
  margin-top: 12px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  background: #fff;
  font-size: 12.5px;
}
`;

const scaffoldApp = `import React, { useState } from "react";

const PRODUCTS = [
  {
    id: 0,
    name: "Mechanical keyboard",
    priceCents: 7500,
  },
  {
    id: 1,
    name: "USB-C hub",
    priceCents: 4200,
  },
  {
    id: 2,
    name: "Noise-canceling headset",
    priceCents: 18900,
  },
];

/**
 * Challenge 08 — Shopping cart
 *
 * Contract:
 *   products  [data-testid="product-<id>"]            with add buttons [data-testid="add-<id>"]
 *   rows      [data-testid="cart-item-<id>"]          one per product in the cart, "x<qty>" inside
 *   remove    [data-testid="remove-<id>"]             removes that product entirely
 *   summary   [data-testid="cart-count"]              how many line items are in the cart
 *             [data-testid="cart-total"]              total price as "$45.00" (cents / 100)
 *   reset     [data-testid="cart-clear"]              empties the cart
 *
 * Behavior:
 *   • clicking add-<id> adds one unit; twice means qty 2 and a doubled line
 *   • remove-<id> and cart-clear wipe the cart cleanly
 */
export default function App() {
  const [cart, setCart] = useState({});

  const addToCart = (id) => {
    // TODO: bump the quantity of 'id' by 1
  };

  const removeFromCart = (id) => {
    // TODO: drop 'id' from the cart completely
  };

  const clearCart = () => {
    // TODO: back to an empty cart
  };

  const count = /* TODO: number of line items */ 0;
  const total = /* TODO: sum of priceCents * qty */ 0;

  return (
    <main className="demo">
      <h2>Gadget store</h2>

      <div className="products" data-testid="products">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="product" data-testid={"product-" + product.id}>
            <span className="name">{product.name}</span>
            <span className="price">{(product.priceCents / 100).toFixed(2)}</span>
            <button data-testid={"add-" + product.id} onClick={() => addToCart(product.id)}>
              Add
            </button>
          </div>
        ))}
      </div>

      <div className="cart">
        <h3>Cart</h3>
        {/* TODO: one .cart-row per product with [data-testid="cart-item-<id>"],
            "x<qty>" somewhere inside, and a remove-<id> button (Remove) */}

        <div className="summary">
          <span>
            <span data-testid="cart-count">{count}</span> items
          </span>
          <span data-testid="cart-total">{"$" + (total / 100).toFixed(2)}</span>
        </div>
        <button className="clear" data-testid="cart-clear" onClick={clearCart}>
          Clear cart
        </button>
      </div>
    </main>
  );
}
`;

const solutionApp = `import React, { useState } from "react";

const PRODUCTS = [
  { id: 0, name: "Mechanical keyboard", priceCents: 7500 },
  { id: 1, name: "USB-C hub", priceCents: 4200 },
  { id: 2, name: "Noise-canceling headset", priceCents: 18900 },
];

export default function App() {
  const [cart, setCart] = useState({});

  const addToCart = (id) => {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const clearCart = () => setCart({});

  const entries = Object.entries(cart);
  const count = entries.length;
  const total = entries.reduce(
    (sum, entry) => {
      const product = PRODUCTS.find((p) => p.id === Number(entry[0]));
      return sum + (product ? product.priceCents * entry[1] : 0);
    },
    0,
  );

  return (
    <main className="demo">
      <h2>Gadget store</h2>

      <div className="products" data-testid="products">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="product" data-testid={"product-" + product.id}>
            <span className="name">{product.name}</span>
            <span className="price">{(product.priceCents / 100).toFixed(2)}</span>
            <button data-testid={"add-" + product.id} onClick={() => addToCart(product.id)}>
              Add
            </button>
          </div>
        ))}
      </div>

      <div className="cart">
        <h3>Cart</h3>
        {entries.map((entry) => {
          const id = Number(entry[0]);
          const qty = entry[1];
          const product = PRODUCTS.find((p) => p.id === id);
          if (!product) return null;
          return (
            <div key={id} className="cart-row" data-testid={"cart-item-" + id}>
              <span>{product.name}</span>
              <span className="qty">
                x{qty} ({(product.priceCents * qty / 100).toFixed(2)})
              </span>
              <button data-testid={"remove-" + id} onClick={() => removeFromCart(id)}>
                Remove
              </button>
            </div>
          );
        })}

        <div className="summary">
          <span>
            <span data-testid="cart-count">{count}</span> items
          </span>
          <span data-testid="cart-total">{"$" + (total / 100).toFixed(2)}</span>
        </div>
        <button className="clear" data-testid="cart-clear" onClick={clearCart}>
          Clear cart
        </button>
      </div>
    </main>
  );
}
`;

const spec = `import React from "react";
import App from "./App";
import { clickable, mount, waitFor } from "./_testbed";

describe("Shopping cart", () => {
  function add(app, id) {
    clickable("add-" + id, app.container).click();
  }

  function soft(app, testId) {
    return app.container.querySelector('[data-testid="' + testId + '"]');
  }

  function textOf(app, testId) {
    const el = soft(app, testId);
    return el ? el.textContent : "";
  }

  test("an empty cart shows 0 items and a $0.00 total", async () => {
    const app = mount(<App />);
    try {
      await waitFor(
        () => textOf(app, "cart-count") === "0" && textOf(app, "cart-total") === "$0.00",
        "empty cart summary",
      );
      expect(soft(app, "cart-item-0")).toBeFalsy();
    } finally {
      app.unmount();
    }
  });

  test("adding a product creates its cart row with the right total", async () => {
    const app = mount(<App />);
    try {
      add(app, 0);
      await waitFor(() => Boolean(soft(app, "cart-item-0")), "cart-item-0 row");
      expect(textOf(app, "cart-total")).toBe("$75.00");
      expect(textOf(app, "cart-count")).toBe("1");
    } finally {
      app.unmount();
    }
  });

  test("adding the same product twice doubles qty and total", async () => {
    const app = mount(<App />);
    try {
      add(app, 0);
      add(app, 0);
      await waitFor(
        () => textOf(app, "cart-total") === "$150.00",
        "doubled total after two adds",
      );
      const row = soft(app, "cart-item-0");
      expect(row.textContent).toContain("x2");
      expect(textOf(app, "cart-count")).toBe("1");
    } finally {
      app.unmount();
    }
  });

  test("two different products stack, remove drops one line", async () => {
    const app = mount(<App />);
    try {
      add(app, 0);
      add(app, 1);
      await waitFor(() => textOf(app, "cart-total") === "$117.00", "combined total");

      clickable("remove-0", app.container).click();
      await waitFor(() => textOf(app, "cart-total") === "$42.00", "keyboard removed");
      expect(soft(app, "cart-item-0")).toBeFalsy();
      expect(textOf(app, "cart-count")).toBe("1");
    } finally {
      app.unmount();
    }
  });

  test("clear wipes every row and resets the summary", async () => {
    const app = mount(<App />);
    try {
      add(app, 0);
      add(app, 2);
      await waitFor(() => textOf(app, "cart-total") === "$264.00", "pre-clear total");

      clickable("cart-clear", app.container).click();
      await waitFor(() => textOf(app, "cart-total") === "$0.00", "cleared total");
      expect(soft(app, "cart-item-0")).toBeFalsy();
      expect(soft(app, "cart-item-2")).toBeFalsy();
      expect(textOf(app, "cart-count")).toBe("0");
    } finally {
      app.unmount();
    }
  });
});
`;

export const cartExercise: ReactExercise = {
	id: "cart",
	num: 8,
	title: "Shopping cart",
	tagline: "Quantity state, derived totals and list management",
	difficulty: "Medium",
	concepts: ["useState objects", "derived values", "immutable updates"],
	brief: `A tiny store with real cart math. Keep an object of quantities, make add/remove/clear immutable updates, and derive the line count and dollar total from it — never store what you can compute. The hidden specs add, double-add, remove and clear, checking every total to the cent.`,
	requirements: [
		'data-testid="cart-total" shows "$<dollars>.<cents>" derived from priceCents × qty',
		"add-<id> bumps that product to qty n+1 (adding twice means x2 and a doubled line)",
		'cart rows have data-testid="cart-item-<id>" with "x<qty>" inside and a "remove-<id>" button',
		"remove-<id> deletes exactly that line; cart-clear empties everything and resets the summary",
	],
	hints: [
		'Store the cart as { id: qty } — updating immutably: setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })).',
		"Derive totals during render instead of storing them: Object.entries(cart).reduce(...).",
		"Money math stays in cents and formats at the end: \"$\" + (total / 100).toFixed(2).",
	],
	files: {
		"/App.js": {
			code: scaffoldApp,
			editable: true,
		},
		"/App.spec.jsx": { code: spec },
		"/_testbed.js": TESTBED_FILE,
		"/index.js": INDEX_FILE,
		"/styles.css": stylesFile(CART_CSS),
	},
	solution: {
		"/App.js": solutionApp,
	},
};
