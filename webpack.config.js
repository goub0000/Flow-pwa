const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',

  entry: {
    // Main entry points for different user types
    main: './src/js/main.js',
    auth: './src/js/auth-bundle.js',
    student: './src/js/student-bundle.js',
    institution: './src/js/institution-bundle.js',
    counselor: './src/js/counselor-bundle.js',
    parent: './src/js/parent-bundle.js',
    recommender: './src/js/recommender-bundle.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? '[name].js' : '[name].[contenthash:8].js',
    chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]'
  },

  resolve: {
    extensions: ['.js', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'assets'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles')
    }
  },

  module: {
    rules: [
      // JavaScript/TypeScript processing
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'ie >= 11']
                },
                useBuiltIns: 'usage',
                corejs: 3
              }],
              '@babel/preset-typescript'
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread'
            ]
          }
        }
      },

      // CSS processing
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: isDev
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('autoprefixer'),
                  require('cssnano')({
                    preset: ['default', {
                      discardComments: { removeAll: true }
                    }]
                  })
                ]
              },
              sourceMap: isDev
            }
          }
        ]
      },

      // Image optimization
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB - inline smaller images
          }
        },
        generator: {
          filename: 'images/[name].[contenthash:8][ext]'
        }
      },

      // Font handling
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]'
        }
      },

      // Video and audio
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'media/[name].[contenthash:8][ext]'
        }
      }
    ]
  },

  plugins: [
    // Environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
      'process.env.ENABLE_ANALYTICS': JSON.stringify(process.env.ENABLE_ANALYTICS || 'true')
    }),

    // Copy static assets
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets/img',
          to: 'images',
          globOptions: {
            ignore: ['**/*.md']
          }
        },
        {
          from: 'firebase.json',
          to: 'firebase.json'
        },
        {
          from: '.firebaserc',
          to: '.firebaserc'
        }
      ]
    }),

    // Extract CSS
    !isDev && new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[id].[contenthash:8].css'
    }),

    // Generate HTML files
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      chunks: ['main'],
      inject: 'body',
      minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      } : false
    }),

    new HtmlWebpackPlugin({
      template: './auth/index.html',
      filename: 'auth/index.html',
      chunks: ['auth'],
      inject: 'body',
      minify: isProduction
    }),

    new HtmlWebpackPlugin({
      template: './students/index.html',
      filename: 'students/index.html',
      chunks: ['student'],
      inject: 'body',
      minify: isProduction
    }),

    new HtmlWebpackPlugin({
      template: './institutions/index.html',
      filename: 'institutions/index.html',
      chunks: ['institution'],
      inject: 'body',
      minify: isProduction
    }),

    // PWA Manifest
    new WebpackPwaManifest({
      name: 'Flow - College Application Management',
      short_name: 'Flow',
      description: 'Streamline your college application process with real-time collaboration and comprehensive tracking.',
      background_color: '#0a0a0a',
      theme_color: '#5a5bb8',
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: '/',
      icons: [
        {
          src: path.resolve('assets/img/logo.png'),
          sizes: [96, 128, 192, 256, 384, 512],
          destination: 'icons'
        }
      ],
      ios: {
        'apple-mobile-web-app-title': 'Flow',
        'apple-mobile-web-app-status-bar-style': 'black-translucent'
      }
    }),

    // Service Worker with Workbox
    !isDev && new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-stylesheets'
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: /^https:\/\/firestore\.googleapis\.com/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'firestore-api'
          }
        },
        {
          urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'firebase-storage',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: /\.(?:js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources'
          }
        }
      ]
    }),

    // Compression
    isProduction && new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    }),

    // Bundle analyzer (only when ANALYZE=true)
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ].filter(Boolean),

  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction
          },
          mangle: {
            safari10: true
          }
        }
      }),
      new CssMinimizerPlugin(),
      // Image optimization
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ['imagemin-mozjpeg', { quality: 80 }],
              ['imagemin-pngquant', { quality: [0.65, 0.80] }],
              ['imagemin-svgo', {
                plugins: [
                  { name: 'removeViewBox', active: false }
                ]
              }],
              ['imagemin-webp', { quality: 75 }]
            ]
          }
        }
      })
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'all'
        },
        // Firebase chunk
        firebase: {
          test: /[\\/]node_modules[\\/]firebase/,
          name: 'firebase',
          priority: 20,
          chunks: 'all'
        },
        // Common chunk
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          chunks: 'all',
          enforce: true
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  },

  devServer: isDev ? {
    contentBase: path.join(__dirname, 'dist'),
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: {
      rewrites: [
        { from: /^\/students/, to: '/students/index.html' },
        { from: /^\/institutions/, to: '/institutions/index.html' },
        { from: /^\/counselors/, to: '/counselors/index.html' },
        { from: /^\/parents/, to: '/parents/index.html' },
        { from: /^\/recommenders/, to: '/recommenders/index.html' },
        { from: /^\/auth/, to: '/auth/index.html' },
        { from: /./, to: '/index.html' }
      ]
    },
    headers: {
      'Service-Worker-Allowed': '/'
    }
  } : undefined,

  devtool: isDev ? 'eval-source-map' : 'source-map',

  performance: {
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
    hints: isProduction ? 'warning' : false
  },

  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }
};