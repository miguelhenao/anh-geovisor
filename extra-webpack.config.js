const ArcGISPlugin = require('@arcgis/webpack-plugin');
/**
 * This is where you define your additional webpack configuration items to be appended to
 * the end of the webpack config.
 */
module.exports = {
  plugins: [new ArcGISPlugin()],
  node: {
    process: false,
    global: false,
    fs: "empty"
  }
};
