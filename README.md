# jbrowse-plugin-diamond

> JBrowse 2 plugin that adds a diamond-shaped glyph for rendering variant features

This plugin adds a Diamond glyph type to JBrowse 2, useful for visualizing genomic variants (SNPs, insertions, deletions, etc.) from VCF files. Ported from JBrowse 1 VEuPath plugins.

## Features

- Renders genomic variants as diamond shapes
- Automatically matches variant features from VCF files
- Configurable colors (fill and border)
- Handles small features (SNPs) with padding for visibility
- Supports all VCF variant types: SNV, SNP, insertions, deletions, inversions, duplications, etc.

## Software requirements

- [Node.js](https://nodejs.org/en/download/) (version 10 or greater)
- npm (which comes with Node.js)
- [JBrowse 2](https://github.com/gmod/jbrowse-components) (version 2.0 or greater)

## Getting started

### Setup

Install dependencies:

```console
$ npm install
```

Then run the setup script to configure the development environment and download a local JBrowse 2 build for testing:

```console
$ npm run setup
```

### Build

```console
$ npm run build
```

### Development

Start the development server with automatic rebuilding:

```console
$ npm start
```

This will:
- Watch for changes and rebuild automatically
- Serve the plugin on port 9001

To test the plugin in JBrowse 2, run in a separate terminal:

```console
$ npm run browse
```

This will serve a local JBrowse 2 instance on port 8998 with the plugin already configured. Navigate to http://localhost:8998 to see the plugin in action.

### Testing

Run unit tests:

```console
$ npm test
```

Run end-to-end tests (starts dev server and runs Cypress tests):

```console
$ npm run test:e2e
```

Open Cypress test runner for interactive testing (requires `npm start` and `npm run browse` to be running):

```console
$ npm run cypress:open
```

## Usage

### In JBrowse Web

After building the plugin, you can use it in JBrowse Web by adding it to your config:

```json
{
  "plugins": [
    {
      "name": "Diamond",
      "url": "http://localhost:9001/dist/jbrowse-plugin-diamond.umd.development.js"
    }
  ]
}
```

For production use, if published to NPM, you can reference it via [unpkg](https://unpkg.com/):

```json
{
  "plugins": [
    {
      "name": "Diamond",
      "url": "https://unpkg.com/jbrowse-plugin-diamond/dist/jbrowse-plugin-diamond.umd.production.min.js"
    }
  ]
}
```

### In Embedded Components

If using `@jbrowse/react-linear-genome-view`, install and import the plugin:

```typescript
import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view'
import DiamondPlugin from 'jbrowse-plugin-diamond'

const state = createViewState({
  assembly: {/* assembly config */},
  plugins: [DiamondPlugin],
  tracks: [/* track configs with variant data */],
  location: 'chr1:1-1000',
})

export const MyApp = () => <JBrowseLinearGenomeView viewState={state} />
```

See https://jbrowse.org/storybook/lgv/main/?path=/docs/using-plugins--docs for more examples.

### Configuring Glyph Colors

The Diamond glyph uses these default colors:
- Fill: `#800080` (purple)
- Border: `#4B0082` (indigo)

These can be customized in your track configuration via the `color1` and `borderColor` properties.

## Publishing to NPM

To publish this plugin to NPM, remove `"private": true` from `package.json` and run:

```console
$ npm publish
```

## License

Apache 2.0
