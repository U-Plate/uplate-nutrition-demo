# UPlate nutrition calculator

Standalone Vite + React demo for AJ Burgers using UPlate’s QDOBA sample menu.

```sh
npm ci
npm run dev
```

Run `npm run build` to type-check and generate static files in `dist/`. Run `npm run preview` to try that build locally. The browser uses the bundled menu and assets.

The snapshot in `src/qdoba-menu.json` was copied from UPlate’s production Cloudflare menu endpoint, recorded in the file’s `source` field. It preserves menu items, sizes, ingredient options, portions, and nutrient amounts. The menu categories are assigned for browsing. Ingredient quantities multiply the source serving amounts. Values missing from any included ingredient are treated as unavailable for that meal. Meal edits are held in the current page session.

## GitHub Pages

Push to `main` to build and publish the site through GitHub Actions. The Vite build uses relative asset paths for both the GitHub Pages project URL and the custom domain.

For `qdoba.u-plate.com`, add a CNAME record with host `qdoba` and target `u-plate.github.io` in Porkbun, then set the custom domain in the repository’s Pages settings. Enable HTTPS enforcement after GitHub issues the certificate.
