import {readdirSync, readFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {src, dest, watch, series, parallel} from 'gulp';
import plumber from 'gulp-plumber';
import pug from 'gulp-pug';
import htmlmin from 'gulp-html-minifier-terser';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import postcssNormalize from 'postcss-normalize';
import postcssLightningcss from 'postcss-lightningcss';
import rename from 'gulp-rename';
import {createGulpEsbuild} from 'gulp-esbuild';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import sharp from 'gulp-sharp-responsive';
import svgmin from 'gulp-svgmin';
import svgSprite from 'gulp-svg-sprite';
import {create} from 'browser-sync';

const PATH_TO_SOURCE = 'src';
const PATH_TO_RAW = `${PATH_TO_SOURCE}/.raw`;
const PATH_TO_DIST = 'build';
const Path = {
  Source: {
    ROOT: PATH_TO_SOURCE,
    TEMPLATES: `${PATH_TO_SOURCE}/templates`,
    PAGES: `${PATH_TO_SOURCE}/templates/pages`,
    DATA: `${PATH_TO_SOURCE}/data`,
    STYLES: `${PATH_TO_SOURCE}/scss`,
    SCRIPTS: `${PATH_TO_SOURCE}/js`,
    IMAGES: `${PATH_TO_SOURCE}/img`,
    ICONS: `${PATH_TO_SOURCE}/icons`,
    FAVICONS: `${PATH_TO_SOURCE}/favicons`,
    FONTS: `${PATH_TO_SOURCE}/fonts`,
  },
  Raw: {
    ROOT: PATH_TO_RAW,
    IMAGES: `${PATH_TO_RAW}/img`,
    ICONS: `${PATH_TO_RAW}/icons`,
  },
  Dist: {
    ROOT: PATH_TO_DIST,
    STYLES: `${PATH_TO_DIST}/css`,
    SCRIPTS: `${PATH_TO_DIST}/js`,
    IMAGES: `${PATH_TO_DIST}/img`,
    ICONS: `${PATH_TO_DIST}/icons`,
  },
};
const PATHS_TO_STATIC = [
  `${Path.Source.IMAGES}/**/*`,
  `${Path.Source.FAVICONS}/**/*.{png,svg}`,
  `${Path.Source.FONTS}/**/*.{woff,woff2}`,
  `${Path.Source.ROOT}/*.ico`,
  `${Path.Source.ROOT}/*.webmanifest`,
  `!${Path.Source.ROOT}/**/.gitkeep`,
];

const sass = gulpSass(dartSass);
const server = create();

let isProduction = false;

/**
 * Combines data from *.json files into a single object.
 */
const getJSONData = (dir) => readdirSync(dir, {
  recursive: true,
})
  .reduce((result, file) => file.endsWith('.json') ? Object.assign(result, JSON.parse(readFileSync(join(dir, file)))) : result, {});

/**
 * Compiles *.html files from *.pug templates.
 */
const processMarkup = () => src(`${Path.Source.PAGES}/*.pug`)
  .pipe(plumber())
  .pipe(pug({
    locals: getJSONData(Path.Source.DATA),
  }))
  .pipe(htmlmin({
    collapseWhitespace: isProduction,
    minifyCSS: isProduction,
    minifyJS: isProduction,
  }))
  .pipe(dest(Path.Dist.ROOT))
  .pipe(server.stream());

/**
 * Compiles a stylesheet from *.scss files.
 */
const processStyles = () => src(`${Path.Source.STYLES}/style.scss`, {
  sourcemaps: !isProduction,
})
  .pipe(plumber())
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss([
    postcssNormalize(),
    postcssLightningcss({
      lightningcssOptions: {
        minify: isProduction,
      },
    }),
  ]))
  .pipe(rename({
    suffix: '.min',
  }))
  .pipe(dest(Path.Dist.STYLES, {
    sourcemaps: !isProduction,
  }))
  .pipe(server.stream());

/**
 * Bundles *.js script files.
 */
const processScripts = () => {
  const esbuild = createGulpEsbuild({incremental: !isProduction});

  return src(`${Path.Source.SCRIPTS}/main.js`)
    .pipe(plumber())
    .pipe(esbuild({
      bundle: true,
      format: 'esm',
      outfile: 'main.min.js',
      target: browserslistToEsbuild(),
      minify: isProduction,
      sourcemap: !isProduction,
    }))
    .pipe(dest(Path.Dist.SCRIPTS))
    .pipe(server.stream());
};

/**
 * Optimizes raster image files and generates *.webp and (optionally) *.avif formats.
 */
const optimizeRaster = () => {
  const RAW_DENSITY = 2;
  const TARGET_FORMATS = [undefined, 'webp']; // Add 'avif' to enable *.avif generation

  const createFormatOptions = () => {
    const formats = [];

    for (let density = RAW_DENSITY; density > 0; density--) {
      formats.push(...TARGET_FORMATS.map((format) => ({
        width: ({width}) => Math.ceil(width * density / RAW_DENSITY),
        format,
        rename: {
          suffix: `@${density}x`,
        },
        jpegOptions: {
          quality: 80,
          progressive: true,
          mozjpeg: true,
        },
        pngOptions: {
          compressionLevel: 9,
          adaptiveFiltering: true,
        },
        webpOptions: {
          quality: 80,
        },
        avifOptions: {
          quality: 65,
        },
      })));
    }

    return {formats};
  };

  return src(`${Path.Raw.IMAGES}/**/*.{png,jpg,jpeg}`)
    .pipe(plumber())
    .pipe(sharp(createFormatOptions()))
    .pipe(dest(Path.Source.IMAGES));
};

/**
 * Creates an SVGO configuration.
 */
const createSvgoOptions = ({isStack = false} = {}) => ({
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
    'removeDimensions',
    'removeRasterImages',
    ...(isStack ? ['removeXMLNS'] : []),
  ],
});

/**
 * Optimizes vector image files.
 */
const optimizeVector = () => src(`${Path.Raw.ROOT}/**/*.svg`)
  .pipe(plumber())
  .pipe(svgmin({
    full: true,
    ...createSvgoOptions(),
  }))
  .pipe(dest(Path.Source.ROOT));

/**
 * Creates an SVG stack.
 */
const createStack = () => src(`${Path.Source.ICONS}/**/*.svg`)
  .pipe(plumber())
  .pipe(svgSprite({
    shape: {
      transform: [{
        svgo: createSvgoOptions({
          isStack: true,
        }),
      }],
    },
    svg: {
      xmlDeclaration: false,
    },
    mode: {
      stack: {
        dest: '.',
        sprite: 'stack.svg',
        rootviewbox: false,
      },
    },
  }))
  .pipe(dest(Path.Dist.ICONS));

/**
 * Copies static files.
 */
const copyStatic = () => src(PATHS_TO_STATIC, {
  encoding: false,
  base: Path.Source.ROOT,
})
  .pipe(dest(Path.Dist.ROOT));

/**
 * Reloads the server.
 */
const reloadServer = (done) => {
  server.reload();
  done();
};

/**
 * Starts the server.
 */
const startServer = () => {
  const serveStatic = PATHS_TO_STATIC
    .filter((path) => !path.startsWith('!'))
    .map((path) => {
      const dir = path.replace(/\/\*\*\/.*$|\/$/, '');
      const route = dir.replace(Path.Source.ROOT, '');

      return {
        route,
        dir,
      };
    });

  server.init({
    ui: false,
    server: Path.Dist.ROOT,
    serveStatic,
    cors: true,
    notify: false,
  });

  watch(`${Path.Source.TEMPLATES}/**/*.pug`, processMarkup);
  watch(`${Path.Source.DATA}/**/*.json`, processMarkup);
  watch(`${Path.Source.STYLES}/**/*.scss`, processStyles);
  watch(`${Path.Source.SCRIPTS}/**/*.js`, processScripts);
  watch(`${Path.Source.ICONS}/**/*.svg`, series(createStack, reloadServer));
  watch(PATHS_TO_STATIC, reloadServer);
};

/**
 * Removes the build directory.
 */
const removeBuild = (done) => {
  rmSync(Path.Dist.ROOT, {
    force: true,
    recursive: true,
  });
  done();
};

/**
 * Builds the project for production.
 */
const buildProduction = (done) => {
  isProduction = true;
  series(
    removeBuild,
    parallel(
      processMarkup,
      processStyles,
      processScripts,
      createStack,
      copyStatic,
    ),
  )(done);
};

/**
 * Builds the project and starts the server for development.
 */
const startDevelopment = (done) => {
  series(
    removeBuild,
    parallel(
      processMarkup,
      processStyles,
      processScripts,
      createStack,
    ),
    startServer,
  )(done);
};

export {
  processMarkup as markup,
  processStyles as styles,
  processScripts as scripts,
  optimizeRaster as raster,
  optimizeVector as vector,
  createStack as stack,
  copyStatic as copy,
  startServer as server,
  removeBuild as clean,
  buildProduction as build,
  startDevelopment as start,
};
