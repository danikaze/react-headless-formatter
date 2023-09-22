const { relative } = require('path');

module.exports = {
  process(src, filename, config, options) {
    // force '/' (instead of '\' in windows)
    const absPath = `/${relative(config.rootDir, filename)}`.replace(
      /\\/g,
      '/'
    );
    return `module.exports = { default: ${JSON.stringify(absPath)} };`;
  },
};
