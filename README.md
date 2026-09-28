# Vendor Product Catalog

A static, GitHub Pages-ready product catalog showing product names, available strengths, 10-vial seller Kit pricing, and single-vial MSRP. China and U.S. fulfillment options are calculated and listed separately.

## Pricing calculation

For each product strength:

1. Calculate each vendor's landed cost after applicable vendor discounts and shipping.
2. Use the highest landed cost as the pricing basis.
3. Divide that landed kit cost by 10 and multiply by 3.5 for the single-vial markup basis.
4. Apply the existing Wholesale and Retail package formulas and round up to the next $5.
5. For oil-based 2-vial packs, extrapolate each offer to a 10-vial landed cost first, then use the highest extrapolated landed cost.

Run `node sync-catalog.mjs _tplprice/index.html catalog-data.json` to rebuild the catalog from TPLPrice.

## Publish with GitHub Pages

1. Upload all files in this folder to the root of a GitHub repository.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` branch and `/ (root)`, then save.

No build step or paid hosting is required.
