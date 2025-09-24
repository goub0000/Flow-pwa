module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: ['last 2 versions', '> 1%', 'IE 11']
    }),
    require('cssnano')({
      preset: [
        'default',
        {
          discardComments: {
            removeAll: true
          },
          normalizeWhitespace: true,
          reduceIdents: false, // Keep animation names
          zindex: false // Don't optimize z-index
        }
      ]
    })
  ]
};