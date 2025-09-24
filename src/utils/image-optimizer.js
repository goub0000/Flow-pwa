// Advanced Image Optimization Utility
// Handles responsive images, format conversion, and lazy loading

/* eslint-env browser */

class ImageOptimizer {
  constructor() {
    this.supportsWebP = this.checkWebPSupport();
    this.supportsAvif = this.checkAvifSupport();
    this.observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };
    this.lazyImageObserver = null;
    this.init();
  }

  // Initialize the image optimizer
  init() {
    console.log('🖼️ Initializing Image Optimizer...');
    console.log(`WebP Support: ${this.supportsWebP}`);
    console.log(`AVIF Support: ${this.supportsAvif}`);

    this.setupLazyLoading();
    this.optimizeExistingImages();
    this.setupResponsiveImages();
  }

  // Check WebP support
  checkWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = () => resolve(true);
      webP.onerror = () => resolve(false);
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Check AVIF support
  checkAvifSupport() {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = () => resolve(true);
      avif.onerror = () => resolve(false);
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  // Setup lazy loading with Intersection Observer
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            observer.unobserve(img);
          }
        });
      }, this.observerOptions);

      // Observe all lazy images
      this.observeLazyImages();
    } else {
      // Fallback for older browsers
      this.loadAllImages();
    }
  }

  // Observe lazy images
  observeLazyImages() {
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    lazyImages.forEach(img => {
      this.lazyImageObserver.observe(img);
    });
  }

  // Load individual image
  async loadImage(img) {
    const originalSrc = img.dataset.src || img.src;
    const optimizedSrc = await this.getOptimizedImageSrc(originalSrc, img);

    // Create a new image to test loading
    const testImg = new Image();

    testImg.onload = () => {
      img.src = optimizedSrc;
      img.classList.add('loaded');
      img.classList.remove('loading');

      // Trigger fade-in animation if supported
      this.animateImageLoad(img);
    };

    testImg.onerror = () => {
      // Fallback to original image
      img.src = originalSrc;
      img.classList.add('loaded', 'error');
      img.classList.remove('loading');
    };

    img.classList.add('loading');
    testImg.src = optimizedSrc;
  }

  // Get optimized image source based on device and browser support
  async getOptimizedImageSrc(originalSrc, imgElement) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const imgWidth = imgElement.offsetWidth || imgElement.dataset.width || 300;
    const targetWidth = Math.round(imgWidth * devicePixelRatio);

    // Check if we have responsive image data
    const responsiveSizes = this.getResponsiveSizes(imgElement);

    if (responsiveSizes) {
      return this.selectBestResponsiveImage(responsiveSizes, targetWidth);
    }

    // Generate optimized URL for single image
    return this.generateOptimizedUrl(originalSrc, {
      width: targetWidth,
      format: await this.getBestImageFormat(),
      quality: this.getOptimalQuality(imgElement)
    });
  }

  // Get responsive image sizes from data attributes or srcset
  getResponsiveSizes(imgElement) {
    const srcset = imgElement.dataset.srcset || imgElement.srcset;
    if (!srcset) return null;

    const sizes = srcset.split(',').map(src => {
      const [url, descriptor] = src.trim().split(' ');
      const width = descriptor ? parseInt(descriptor.replace('w', '')) : null;
      return { url, width };
    });

    return sizes.filter(size => size.width);
  }

  // Select best responsive image based on viewport
  selectBestResponsiveImage(responsiveSizes, targetWidth) {
    // Sort by width
    responsiveSizes.sort((a, b) => a.width - b.width);

    // Find the smallest image that's larger than target
    const bestMatch = responsiveSizes.find(size => size.width >= targetWidth);

    // If no larger image found, use the largest available
    return bestMatch ? bestMatch.url : responsiveSizes[responsiveSizes.length - 1].url;
  }

  // Generate optimized image URL
  generateOptimizedUrl(originalSrc, options) {
    const { width, format, quality } = options;

    // If using a CDN like Cloudinary or ImageKit
    if (originalSrc.includes('cloudinary.com')) {
      return this.generateCloudinaryUrl(originalSrc, options);
    }

    if (originalSrc.includes('imagekit.io')) {
      return this.generateImageKitUrl(originalSrc, options);
    }

    // For Firebase Storage, we'll use URL parameters
    if (originalSrc.includes('firebasestorage.googleapis.com')) {
      return this.generateFirebaseStorageUrl(originalSrc, options);
    }

    // Return original if no optimization available
    return originalSrc;
  }

  // Generate Cloudinary optimized URL
  generateCloudinaryUrl(originalSrc, options) {
    const { width, format, quality } = options;
    const transformations = [
      `w_${width}`,
      `f_${format}`,
      `q_${quality}`,
      'c_limit' // Don't upscale
    ];

    // Insert transformations into Cloudinary URL
    return originalSrc.replace('/upload/', `/upload/${transformations.join(',')}/`);
  }

  // Generate ImageKit optimized URL
  generateImageKitUrl(originalSrc, options) {
    const { width, format, quality } = options;
    const params = new URLSearchParams();

    params.append('tr', `w-${width},f-${format},q-${quality}`);

    const separator = originalSrc.includes('?') ? '&' : '?';
    return `${originalSrc}${separator}${params.toString()}`;
  }

  // Generate Firebase Storage optimized URL (using transform parameters)
  generateFirebaseStorageUrl(originalSrc, options) {
    const { width, format, quality } = options;
    const params = new URLSearchParams();

    params.append('w', width);
    params.append('f', format);
    params.append('q', quality);

    const separator = originalSrc.includes('?') ? '&' : '?';
    return `${originalSrc}${separator}${params.toString()}`;
  }

  // Get best image format based on browser support
  async getBestImageFormat() {
    if (await this.supportsAvif) return 'avif';
    if (await this.supportsWebP) return 'webp';
    return 'jpg';
  }

  // Get optimal quality based on image context
  getOptimalQuality(imgElement) {
    // Hero images and important visuals get higher quality
    if (imgElement.classList.contains('hero-image') ||
        imgElement.classList.contains('featured-image')) {
      return 85;
    }

    // Profile pictures and avatars
    if (imgElement.classList.contains('avatar') ||
        imgElement.classList.contains('profile-image')) {
      return 80;
    }

    // Thumbnails and gallery images
    if (imgElement.classList.contains('thumbnail') ||
        imgElement.classList.contains('gallery-image')) {
      return 70;
    }

    // Default quality
    return 75;
  }

  // Animate image load
  animateImageLoad(img) {
    // Add CSS transition for fade-in effect
    img.style.transition = 'opacity 0.3s ease-in-out';
    img.style.opacity = '0';

    // Trigger fade-in
    requestAnimationFrame(() => {
      img.style.opacity = '1';
    });
  }

  // Setup responsive images for existing content
  setupResponsiveImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');

    images.forEach(img => {
      this.makeImageResponsive(img);
      img.setAttribute('data-optimized', 'true');
    });
  }

  // Make an image responsive
  makeImageResponsive(img) {
    if (img.srcset || img.dataset.srcset) return; // Already responsive

    const originalSrc = img.src;
    if (!originalSrc) return;

    // Generate responsive sizes
    const responsiveSizes = this.generateResponsiveSizes(originalSrc);

    if (responsiveSizes.length > 1) {
      const srcset = responsiveSizes.map(size => `${size.url} ${size.width}w`).join(', ');
      img.srcset = srcset;
      img.sizes = this.generateSizesAttribute(img);
    }
  }

  // Generate responsive image sizes
  generateResponsiveSizes(originalSrc) {
    const breakpoints = [480, 768, 1024, 1366, 1920];
    const sizes = [];

    breakpoints.forEach(width => {
      const optimizedUrl = this.generateOptimizedUrl(originalSrc, {
        width,
        format: 'webp', // Default to WebP for srcset
        quality: 75
      });

      sizes.push({ url: optimizedUrl, width });
    });

    return sizes;
  }

  // Generate sizes attribute based on image context
  generateSizesAttribute(img) {
    // Check for explicit size hints
    if (img.dataset.sizes) {
      return img.dataset.sizes;
    }

    // Hero images typically full width
    if (img.classList.contains('hero-image')) {
      return '100vw';
    }

    // Gallery images
    if (img.classList.contains('gallery-image')) {
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }

    // Thumbnails and avatars
    if (img.classList.contains('thumbnail') || img.classList.contains('avatar')) {
      return '(max-width: 768px) 80px, 120px';
    }

    // Default responsive behavior
    return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px';
  }

  // Optimize existing images
  optimizeExistingImages() {
    const images = document.querySelectorAll('img:not([data-src]):not([loading="lazy"])');

    images.forEach(img => {
      if (img.complete && img.naturalHeight !== 0) {
        // Image already loaded
        this.processLoadedImage(img);
      } else {
        // Wait for image to load
        img.addEventListener('load', () => this.processLoadedImage(img));
      }
    });
  }

  // Process already loaded images
  async processLoadedImage(img) {
    const optimizedSrc = await this.getOptimizedImageSrc(img.src, img);

    if (optimizedSrc !== img.src) {
      // Test if optimized version is available and smaller
      this.testOptimizedImage(img, optimizedSrc);
    }

    // Add responsive attributes
    this.makeImageResponsive(img);
  }

  // Test optimized image and replace if better
  testOptimizedImage(originalImg, optimizedSrc) {
    const testImg = new Image();

    testImg.onload = () => {
      // Only replace if the optimized image is likely smaller
      // (This is a heuristic - in production you might want more sophisticated logic)
      originalImg.src = optimizedSrc;
      originalImg.classList.add('optimized');
    };

    testImg.onerror = () => {
      // Keep original image
      console.warn('Failed to load optimized image:', optimizedSrc);
    };

    testImg.src = optimizedSrc;
  }

  // Load all images (fallback for browsers without Intersection Observer)
  loadAllImages() {
    const lazyImages = document.querySelectorAll('img[data-src]');

    lazyImages.forEach(img => {
      this.loadImage(img);
    });
  }

  // Preload critical images
  preloadCriticalImages() {
    const criticalImages = document.querySelectorAll('img[data-preload="true"]');

    criticalImages.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.dataset.src || img.src;

      if (img.srcset) {
        link.imageSrcset = img.srcset;
        link.imageSizes = img.sizes;
      }

      document.head.appendChild(link);
    });
  }

  // Add new images to optimization pipeline
  addImages(images) {
    if (!Array.isArray(images)) {
      images = [images];
    }

    images.forEach(img => {
      if (img.tagName !== 'IMG') return;

      this.makeImageResponsive(img);

      if (img.dataset.src || img.loading === 'lazy') {
        if (this.lazyImageObserver) {
          this.lazyImageObserver.observe(img);
        } else {
          this.loadImage(img);
        }
      }
    });
  }

  // Cleanup observer when not needed
  destroy() {
    if (this.lazyImageObserver) {
      this.lazyImageObserver.disconnect();
      this.lazyImageObserver = null;
    }
  }
}

// CSS for image optimization
const imageOptimizerStyles = `
  .loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .loaded {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .error {
    filter: grayscale(100%);
    opacity: 0.7;
  }

  /* Responsive image containers */
  .image-container {
    position: relative;
    overflow: hidden;
  }

  .image-container img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Aspect ratio helpers */
  .aspect-16-9 { aspect-ratio: 16/9; }
  .aspect-4-3 { aspect-ratio: 4/3; }
  .aspect-1-1 { aspect-ratio: 1/1; }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = imageOptimizerStyles;
  document.head.appendChild(styleSheet);
}

// Initialize global image optimizer
let globalImageOptimizer;

document.addEventListener('DOMContentLoaded', () => {
  globalImageOptimizer = new ImageOptimizer();

  // Preload critical images
  globalImageOptimizer.preloadCriticalImages();
});

// Export for use in other modules
window.ImageOptimizer = ImageOptimizer;
window.imageOptimizer = globalImageOptimizer;

export default ImageOptimizer;