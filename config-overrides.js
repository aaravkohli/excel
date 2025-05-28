module.exports = function override(config, env) {
  // Disable source maps
  config.devtool = false;
  return config;
}; 