const fs = require('fs');
const getOptions = require('loader-utils').getOptions;
const path = require('path');

const endRequireRe = /<!-- <\/require> -->/g;
const requireRe = /<!-- <require path="(.*?)"> -->/g;
const sourcemapIdRe = /data-sm="(.*?)"/;
const tagRe = /<\w[^'">]*(("[^"]*"|'[^']*')[^'">]*)*>/g

module.exports = function (source) {
  // Options.
  let options = getOptions(this);
  options = options || {};
  const outPath = options.outputPath || path.dirname(this.resourcePath);
  const tagWhitelist = options.tag || null;

  const sourcemap = {};
  let sourcemapId = 0;

  // Walk though file and see what file where this tag is defined.
  let fileStack = [{file: this.resourcePath, lineNumber: 0, index: 0}];
  const lines = source.split('\n');
  const newLines = [];
  lines.forEach(line => {
    const originalLine = line;
    const requireMatch = requireRe.exec(line);

    // Inside another file.
    if (requireMatch) {
      fileStack.unshift({file: requireMatch[1], lineNumber: 0, index: 0});
      return;
    }

    // Back up a file.
    if (line.match(endRequireRe)) {
      fileStack.shift();
      return;
    }

    // Walk through tags of the line.
    let match;
    while (match = tagRe.exec(line)) {
      if (match[0].indexOf('<require') !== -1 ||
          match[0].indexOf('data-sm=') !== -1) { continue; }

      // Attach sourcemap ID.
      // Tag regex option to filter what to attach sourcemaps for.
      if (!tagWhitelist || match[0].match(tagWhitelist)) {
        let id = sourcemapId++;

        // Use integer to give potential hot reloaders less work.
        const updatedTag = match[0].replace(/>$/, ` data-sm="${id}">`);

        sourcemap[id] = {
          file: fileStack[0].file,
          line: fileStack[0].lineNumber,
          column: line.indexOf(match[0]),
          length: match[0].length,
          index: fileStack[0].index + match.index
        };

        line = line.replace(match[0], updatedTag);
      }
    }

    fileStack[0].index += originalLine.length;
    fileStack[0].lineNumber++;
    newLines.push(line);
  });

  fs.writeFileSync(path.resolve(outPath, '.html.map.json'),
                   JSON.stringify(sourcemap));
  source = source.replace(requireRe, '');
  source = source.replace(endRequireRe, '');
  return newLines.join('\n');
};

function randStr () {
  return Math.random().toString(36).substring(7);
}
