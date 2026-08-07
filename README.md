# Vendor Product Catalog

A static, GitHub Pages-ready product catalog showing product names, available strengths, and three-vial seller pricing. China and U.S. fulfillment options are calculated and listed separately.

## Pricing calculation

For each product strength and region:

1. Find the lowest, median, and highest vendor prices for a 10-vial kit.
2. Average those three prices.
3. Divide the average kit cost by 10 and multiply by 3.5.
4. Add $10 BAC water per vial.
5. Multiply by three vials, apply the 10% three-vial discount, and round up to the next $5.

Run `node build-catalog.mjs` after replacing the source comparison file referenced at the top of that script.

## Publish with GitHub Pages

1. Upload all files in this folder to the root of a GitHub repository.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` branch and `/ (root)`, then save.

No build step or paid hosting is required.
