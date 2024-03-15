# pug-template

[![GitHub Release][release-image]][release-url]
[![GitHub License][license-image]][license-url]
[![Check Workflow Status][workflow-image]][workflow-url]

The basic Pug template to start development.

- Requires Node.js 18 (or later).
- Designed for the latest versions of Chrome, Edge, Safari, Firefox, Opera.

## Installation

1. Clone this repository:
    ```sh
    git clone git@github.com:koshikishi/pug-template.git
    ```

2. Install dependencies:
    ```sh
    npm i
    ```

3. Start development (http://localhost:3000/ should open in your default browser):
    ```sh
    npm start
    ```

## Project Structure

This is the general directory structure of the project:

```text
└── src/
    ├── .raw/                     # Original files (ignored by git)
    │   ├── icons/                # Original SVG icons
    │   └── img/                  # Original images
    ├── data/                     # Project data
    ├── favicons/                 # Favicons
    ├── fonts/                    # Fonts
    ├── icons/                    # Optimized SVG icons
    ├── img/                      # Optimized images
    ├── js/                       # Scripts
    │   ├── vendor/               # 3rd party scripts
    │   └── main.js               # Main script
    ├── scss/                     # Style files
    │   ├── blocks/               # Block styles
    │   ├── common/               # Common styles
    │   ├── mixins/               # Mixins
    │   ├── vendor/               # 3rd party styles
    │   └── style.scss            # Main style file
    ├── templates/                # Template files
    │   ├── components/           # Components
    │   │   ├── blocks/           # Blocks
    │   │   ├── mixins/           # Mixins
    │   │   └── components.pug    # Included components
    │   ├── layouts/              # Layouts
    │   │   └── main.pug          # Basic layout
    │   └── pages/                # Pages
    │       └── index.pug         # Main page
    └── manifest.webmanifest      # Web app manifest
```

A detailed description of each directory can be found in the corresponding section below.

## Usage

- `npm start` - starts the server for development
- `npm run build` - builds the project for production
- `npm run preview` - previews the production build
- `npm run lint` - runs all linter checks
  - `npm run lint:spaces` - runs the editorconfig check
  - `npm run lint:markup` - validates HTML markup using the W3C validator
  - `npm run lint:templates` - validates templates using Pug linter
  - `npm run lint:styles` - validates styles using Stylelint
  - `npm run lint:scripts` - validates scripts using ESLint
- `npm run optimize` - optimizes all images from `src/.raw/` (may take a while)
  - `npm run optimize:raster` - optimizes raster images
  - `npm run optimize:vector` - optimizes vector images

## Markup

The project uses the Pug template engine. See the [documentation][pug-url] for effective use of the template engine.

All template files should be kept in the `src/templates/` directory.

```text
└── src/
    └── templates/
        ├── components/
        │   ├── blocks/
        │   │   ├── header.pug
        │   │   └── ...
        │   ├── mixins/
        │   │   ├── icon.pug
        │   │   ├── picture.pug
        │   │   └── ...
        │   └── components.pug
        ├── layouts/
        │   └── main.pug
        └── pages/
            ├── catalog.pug
            ├── index.pug
            └── ...
```

Page templates should be kept in the `src/templates/pages/` directory. Use the `index.pug` as a reference for new pages.

### Components

Block files should be kept in the `src/templates/components/blocks/` directory. Use the `header.pug` as a reference for new blocks.

Mixins should be kept in the `src/templates/components/mixins/` directory.

All blocks and mixins should be included via the `components.pug`. They can then be used in templates.

```pug
//- Using an icon from an SVG stack
+icon('arrow', 30, 30)
```

### Data

Data that can be used in multiple places should be kept in the `src/data/` directory as JSON files.

```text
└── src/
    └── data/
        ├── data.json
        └── ...
```

This data can then be accessed in templates.

```pug
div.container
  p= main.content
```

## Styles

The project uses the Sass preprocessor with the SCSS syntax. See the [documentation][sass-url] for effective use of the SCSS features.

All style files should be kept in the `src/scss/` directory.

```text
└── src/
    └── scss/
        ├── blocks/
        │   ├── _header.scss
        │   └── ...
        ├── common/
        │   ├── _fonts.scss
        │   ├── _global.scss
        │   ├── _keyframes.scss
        │   ├── _layout.scss
        │   ├── _utils.scss
        │   └── _variables.scss
        ├── mixins/
        │   ├── _media.scss
        │   ├── _utils.scss
        │   └── ...
        ├── vendor/
        │   ├── _normalize.scss
        │   └── ...
        └── style.scss
```

Block files should be kept in the `src/scss/blocks/` directory.

Mixins should be kept in the `src/scss/mixins/` directory.

3rd party style files should be kept in the `src/scss/vendor/` directory.

All blocks, vendor and common style files should be loaded in the `style.scss`.

```scss
// Common
@use "common/variables";
@use "common/fonts";
@use "common/global";

// Blocks
@use "blocks/header";
```

### Modules

SCSS variables and mixins should be loaded as modules in the style files in which they are used.

```scss
@use "../common/variables" as *;
@use "../mixins/utils" as *;

.menu__list {
  @include list-reset;

  font-family: $font-primary;
}
```

## Scripts

All script files should be kept in the `src/js/` directory.

```text
└── src/
    └── js/
        ├── modules/
        │   ├── modal.js
        │   └── ...
        ├── vendor/
        │   └── ...
        └── main.js
```

It is recommended to keep your scripts organized and group them into appropriate directories based on their purpose.

3rd party script files should be kept in the `src/js/vendor/` directory.

All used scripts should be imported as modules in the `main.js`.

## Images

All non-optimized 2x pixel density raster images and content vector images should be placed in the `src/.raw/img/` directory. All files in the `src/.raw/` directory are ignored by git.

```text
└── src/
    └── .raw/
        └── img/
            ├── bg.jpg
            ├── hero.png
            └── logo.svg
```

After adding new images to the project, run `npm run optimize`, which for each raster image will create in the `src/img/` directory:

- an optimized copy with the `@2x` suffix,
- an optimized 2x smaller copy with the `@1x` suffix,
- a copy in WebP format with the `@2x` suffix,
- a 2x smaller copy in WebP format with the `@1x` suffix.

The command will also create an optimized copy of each vector image.

```text
└── src/
    └── img/
        ├── bg@1x.jpg
        ├── bg@2x.jpg
        ├── bg@1x.webp
        ├── bg@2x.webp
        ├── hero@1x.png
        ├── hero@2x.png
        ├── hero@1x.webp
        ├── hero@2x.webp
        └── logo.svg
```

You can also specifically run `npm run optimize:raster` for raster images and `npm run optimize:vector` for vector images.

Images in the `src/.raw/` directory can be deleted after optimization, so that running the command again for new images does not re-generate already existing files.

### SVG stack

All non-optimized vector icons for SVG sprite should be placed in the `src/.raw/icons/` directory.

```text
└── src/
    └── .raw/
        └── icons/
            ├── tg.svg
            └── vk.svg
```

After adding new icons, run `npm run optimize` (or `npm run optimize:vector`), which will create an optimized copy of each icon in the `src/icons/` directory.

```text
└── src/
    └── icons/
        ├── tg.svg
        └── vk.svg
```

The `stack.svg` file will be automatically generated from the icons when the build is created.

```text
└── build/
    └── icons/
        └── stack.svg
```

### Favicons

All favicons should be stored in the `src/favicons/` directory, except for `favicon.ico`, which should be stored in the `src/` directory.

```text
└── src/
    ├── favicons/
    │   ├── 192.png
    │   ├── 512.png
    │   ├── apple-touch-icon.png
    │   └── favicon.svg
    ├── favicon.ico
    └── manifest.webmanifest
```

It is recommended to use 192x192 and 512x512 PNG favicons included via `manifest.webmanifest`, a 180x180 `apple-touch-icon` favicon, and an SVG favicon. Optionally, an ICO favicon for older browsers.

## Fonts

All font files should be stored in the `src/fonts/` directory.

```text
└── src/
    └── fonts/
        ├── roboto-bold.woff2
        ├── roboto-regular.woff2
        └── ...
```

## Useful links

- [Changelog](CHANGELOG.md)
- [Pug documentation][pug-url]
- [Sass documentation][sass-url]

[release-image]: https://img.shields.io/github/v/release/koshikishi/pug-template
[release-url]: https://github.com/koshikishi/pug-template/releases
[license-image]: https://img.shields.io/github/license/koshikishi/pug-template
[license-url]: https://github.com/koshikishi/pug-template/blob/main/LICENSE
[workflow-image]: https://github.com/koshikishi/pug-template/actions/workflows/check.yml/badge.svg
[workflow-url]: https://github.com/koshikishi/pug-template/actions

[pug-url]: https://pugjs.org/api/getting-started.html
[sass-url]: https://sass-lang.com/documentation/
