const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api', createProxyMiddleware({
    target: 'https://api.anthropic.com',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    headers: {
      'anthropic-version': '2023-06-01',
      'x-api-key': 'YOUR_API_KEY_HERE'
    }
  }));
};