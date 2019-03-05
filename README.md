## html-sourcemap-loader

Webpack loader that creates a source map for HTML via data attributes and a
JSON file.

Useful for web development editor tools to help modify source code live.

### Usage

[html-require-loader]: https://github.com/ngokevin/html-require-loader

Supports features from [html-require-loader] that allows HTML to include other
HTML files through Webpack.

```
npm install --save html-sourcemap-loader
```

#### Configuration

| Option     | Description                                                                    | Default                          |
|------------|--------------------------------------------------------------------------------|----------------------------------|
| outputPath | Where to output `.html.map.json` sourcemap file.                               | Same path as required HTML file. |
| tag        | Regex to filter what elements to attach `data-sm` sourcemap data attribute to. | *                                |

```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.html/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'html-sourcemap-loader',
            options: {
              outputPath: __dirname,
              tag: /.*?/
            }
          }
        ]
      }
    ]
  }
  // ...
}
```

With the help of some other loader (e.g., I use it with
`aframe-super-hot-html-loader`).

```js
require('./index.html');
```

Sourcemap data attributes will be injected into elements:

```html
<h1 id="foo" data-sm="0"></h1>
<h2 id="bar" data-sm="1"></h2>
```

Then a sourcemap JSON file will be output on change (`.html.map.json`)
depending on `outputPath`:

```js
{
  1: {
    file: '/path/to/index.html',
    line: 0,
    column: 0,
    elementIndex: 0
  },
  2: {
    file: '/path/to/index.html',
    line: 1,
    column: 0,
    elementIndex: 0
  }
}
```

This JSON can be used to reference live HTML elements to their position in the
source code.

#### Pre-Generated HTML

If a templating engine or static generator was used, the HTML file can be noted
as:

```html
<body>
  <h1 id="foo"></h1>
  <h2 id="bar"></h2>

  <!-- <require path="/path/to/bar.html"> -->
  <p>This element was defined in another HTML file.</p>
  <!-- </require> -->
</body>
```
