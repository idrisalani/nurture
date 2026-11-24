module.exports = {
  expo: {
    name: 'NurtureNet Child', slug: 'nurturenet-child', version: '1.0.0', orientation: 'portrait', scheme: 'nurturenet-child',
    icon: './assets/images/icon.png', userInterfaceStyle: 'automatic', newArchEnabled: false,
    splash: { backgroundColor: '#212E86' },
    android: {
      package: 'ng.nurturenet.child', versionCode: 1,
      adaptiveIcon: { foregroundImage: './assets/images/adaptive-icon.png', backgroundColor: '#212E86' },
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_LOCATION', 'POST_NOTIFICATIONS', 'RECEIVE_BOOT_COMPLETED'],
    },
    web: { favicon: './assets/images/favicon.png' },
    plugins: [
      'expo-secure-store', 'expo-font',
      ['expo-location', { isAndroidBackgroundLocationEnabled: true, isAndroidForegroundServiceEnabled: true,
        locationAlwaysAndWhenInUsePermission: 'NurtureNet shares where you are with your parent, so they know you are safe.' }],
    ],
  },
};
