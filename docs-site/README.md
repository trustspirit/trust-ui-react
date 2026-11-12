# trust-ui docs site

The documentation site for `trust-ui-react`, built with [Docusaurus](https://docusaurus.io/).

The site imports the library from `../dist`, so build the library first.

```bash
# from the repository root
pnpm install
pnpm build          # builds ../dist, which the docs import
pnpm docs:dev       # local dev server
pnpm docs:build     # static build into docs-site/build
pnpm docs:serve     # serve the static build
```

Pages live in `docs/`. Component pages use two helpers from `src/components/`:
`ComponentPreview` (live demo with a theme toggle and the source) and `PropsTable`.

Deployment is handled by `.github/workflows/deploy-docs.yml` on every push to `main`.
