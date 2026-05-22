/**
 * Root page for the Daisy Showcase application.
 */

import React from "react";

// External Imports ----------------------------------------------------------

// Internal Imports ----------------------------------------------------------

// Public Objects ------------------------------------------------------------

export default function HomePage() {
  return (
      <div className="p-2 mb-4 bg-base-100 rounded-3">
        <h1 className="header text-center">
          Welcome To The ShopShop Application
        </h1>
        <p className="lead text-center">
          Click one of the tabs above to retrieve the corresponding information.
        </p>
      </div>
  );
};
