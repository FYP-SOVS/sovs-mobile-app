const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to enable cleartext traffic for Android
 * This allows HTTP connections (not just HTTPS) for development
 */
const withAndroidCleartextTraffic = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    
    // Add usesCleartextTraffic attribute to application tag
    if (!application.$) {
      application.$ = {};
    }
    
    application.$['android:usesCleartextTraffic'] = 'true';

    return config;
  });
};

module.exports = withAndroidCleartextTraffic;


