// next.config.js
const path = require('path');
module.exports = {
  turbopack: {
    root: path.resolve(__dirname)
    // No distDirRoot override unless required
  },
  // ...existing config...
};
