const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Đặt đường dẫn base chuẩn cho web assets trên GitHub Pages
config.transformer = {
  ...config.transformer,
  publicPath: '/Todo-AI/_expo/static',
};

module.exports = config;