const cheerio = require('cheerio');
const fs = require('fs');
const getOptions = require('loader-utils').getOptions;
const path = require('path');

const endRequireRe = /<\/require>/;
const requireRe = /<require path="(.*?)">/;

module.exports = function (source) {
  // Options.
  let options = getOptions(this);
  options = options || {};
  const outPath = options.outputPath || path.dirname(this.resourcePath);

  const $ = cheerio.load(source);

  const fileStack = [{file: this.resourcePath, fileId: 0, index: 0}];
  const sourcemap = {files: [this.resourcePath]};
  const files = sourcemap.files;
  let sourcemapId = 0;

  addChildrenSourcemap($('body')[0].children);

  function addChildrenSourcemap (children) {
    children.forEach(el => {
      if (el.type === 'comment') {
        const requireMatch = requireRe.exec(el.data);
        if (requireMatch) {
          const filename = requireMatch[1];
          if (files.indexOf(filename) === -1) { files.push(filename); }
          fileStack.unshift({
            file: filename,
            fileId: files.indexOf(filename),
            index: 0
          });
        }
        const endRequireMatch = endRequireRe.exec(el.data);
        if (endRequireMatch) { fileStack.shift(); }
        return;
      }

      if (el.type !== 'tag') { return; }
      if (el.name === 'require') { return; }

      const id = sourcemapId++;
      $(el).attr('data-sm', id);
      sourcemap[id] = {
        file: fileStack[0].fileId,
        index: fileStack[0].index++
      };

      if (el.children) { addChildrenSourcemap(el.children); }
    });
  }

  fs.writeFileSync(path.resolve(outPath, '.html.map.json'),
                   JSON.stringify(sourcemap));
  return $.html()
    .replace(requireRe, '')
    .replace(endRequireRe, '');
};
