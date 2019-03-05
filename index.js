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

  // Attach sourcemap IDs.
  let sourcemapId = 0;
  let match;
  while (match = tagRe.exec(source)) {
    if (match[0].startsWith('</') || match[0].startsWith('< /')) { continue; }

    // Tag regex option to filter what to attach sourcemaps for.
    if (tagWhitelist && !match[0].match(tagWhitelist)) { continue; }

    if (match[0].indexOf('<require') !== -1) { continue; }

    // Use integer to give potential hot reloaders less work.
    const updatedTag = match[0].replace(/>$/, ` data-sm="${sourcemapId++}">`);
    source = source.replace(match[0], updatedTag);
  }

  // Walk though file and see what file where this tag is defined.
  let fileStack = [this.resourcePath];
  const lines = source.split('\n');
  lines.forEach((line, lineNumber) => {
    const requireMatch = requireRe.exec(line);

    // Inside another file.
    if (requireMatch) {
      fileStack.unshift(requireMatch[1]);
      return;
    }

    // Back up a file.
    if (line.match(endRequireRe)) {
      fileStack.shift();
      return;
    }

    let elementIndex = -1;
    let tagMatch;
    while (tagMatch = tagRe.exec(line)) {
      elementIndex++;
      const sourcemapIdMatch = tagMatch[0].match(sourcemapIdRe);
      if (!sourcemapIdMatch) { continue; }
      sourcemap[sourcemapIdMatch[1]] = {
        file: fileStack[0],
        line: lineNumber,
        column: line.indexOf(tagMatch[0]),
        elementIndex: elementIndex
      };
    }
  });

  fs.writeFileSync(path.resolve(outPath, '.html.map.json'),
                   JSON.stringify(sourcemap));
  source = source.replace(requireRe, '');
  source = source.replace(endRequireRe, '');
  return source;
};

function randStr () {
  return Math.random().toString(36).substring(7);
}
