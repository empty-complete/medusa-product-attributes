<div align="center">
  <img src="./assets/logo.png" alt="medusa-product-attributes logo" width="120">
  <h1>Medusa Product Attributes</h1>
  <p><i>A flexible attribute system for Medusa v2 — text, number, file, boolean, with units and category inheritance</i></p>

  <p>
    <a href="https://github.com/empty-complete/medusa-product-attributes/blob/main/LICENSE">
      <img src="https://img.shields.io/npm/l/@empty-complete-org/medusa-product-attributes" alt="License">
    </a>
    <a href="https://www.npmjs.com/package/@empty-complete-org/medusa-product-attributes">
      <img src="https://img.shields.io/npm/v/@empty-complete-org/medusa-product-attributes" alt="npm version">
    </a>
    <a href="https://www.npmjs.com/package/@empty-complete-org/medusa-product-attributes">
      <img src="https://img.shields.io/npm/dm/@empty-complete-org/medusa-product-attributes" alt="npm downloads">
    </a>
    <a href="https://github.com/empty-complete/medusa-product-attributes/actions/workflows/ci.yml">
      <img src="https://github.com/empty-complete/medusa-product-attributes/actions/workflows/ci.yml/badge.svg" alt="CI Status">
    </a>
  </p>

  <p>
    <a href="https://medusajs.com/"><img src="https://img.shields.io/badge/Medusa-v2-000000" alt="Medusa v2"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6" alt="TypeScript"></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%3E=20-339933" alt="Node.js"></a>
  </p>

</div>

---

## Features

- **4 attribute types**: text, number (with units), file, boolean
- **Category inheritance**: attributes defined on a parent category are automatically inherited by all subcategories
- **Global attributes**: applied to every product in the store
- **Templates**: reusable attribute blueprints — apply to any category in one click
- **Automatic slug generation**: labels are transliterated (works with Russian, Chinese, any script)
- **Smart file naming**: uploaded images are renamed to `{product_handle}_{attr_key}.ext`
- **Admin UI included**: category widget, product widget, two Settings pages
- **Ships with migrations**: just run `npx medusa db:migrate`

## Screenshots

### Category widget with inheritance
![Category widget](./assets/category-widget.png)

### Product attribute values
![Product widget](./assets/product-widget.png)

### Global attributes settings
![Global attributes](./assets/global-attributes.png)

### Attribute templates settings
![Templates](./assets/templates.png)

## Installation

```bash
pnpm add @empty-complete-org/medusa-product-attributes
# or
npm install @empty-complete-org/medusa-product-attributes
# or
yarn add @empty-complete-org/medusa-product-attributes
```

Add to `medusa-config.ts`:

```ts
module.exports = defineConfig({
  plugins: [
    {
      resolve: "@empty-complete-org/medusa-product-attributes",
      options: {},
    },
  ],
})
```

Run migrations:

```bash
npx medusa db:migrate
```

## Usage

### Admin

1. **Category attributes** — open any category in admin, the "Атрибуты" widget appears below the details. Add custom attributes (inherited by all subcategories), or pick one from a template.
2. **Global attributes** — Settings → *Global Attributes*. Applied to every product automatically.
3. **Templates** — Settings → *Attribute Templates*. Create reusable blueprints.
4. **Product values** — open any product, the "Характеристики" widget shows all inherited + global attributes with inputs for their values.

### API

```ts
// List all attributes for a product (globals + category chain)
GET /admin/product/:productId/attribute-schema

// List/create/update attributes for a category
GET    /admin/category/:categoryId/custom-attributes
POST   /admin/category/:categoryId/custom-attributes
PATCH  /admin/category/:categoryId/custom-attributes

// Global attributes
GET    /admin/global-attributes
POST   /admin/global-attributes
PATCH  /admin/global-attributes

// Templates
GET    /admin/attribute-templates
POST   /admin/attribute-templates
PATCH  /admin/attribute-templates
POST   /admin/attribute-templates/:id/apply  { category_id }

// Product values
GET    /admin/product/:productId/custom-attributes
POST   /admin/product/:productId/custom-attributes
```

## Attribute types

| Type | Admin input | Stored in |
|------|-------------|-----------|
| `text` | text input | `value` |
| `number` | number input + unit badge | `value`, `value_numeric` |
| `file` | upload button | `value` (URL), `value_file` |
| `boolean` | select Yes/No | `value` |

## Peer dependencies

- `@medusajs/framework` ^2.13
- `@medusajs/medusa` ^2.13
- `@medusajs/admin-sdk` ^2.13
- `@medusajs/ui` ^4
- `@tanstack/react-query` ^5
- `react` ^18 || ^19

## Development

```bash
pnpm install
pnpm test
pnpm run build     # builds to .medusa/server/
pnpm run dev       # medusa plugin:develop
```

## License

MIT © empty-complete
