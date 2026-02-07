export default {
  expo: {
    name: "Akilo",
    slug: "akilo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "dark",
    scheme: "akilo",
    newArchEnabled: true,
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#0a1a15"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#0a1a15"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.akilo.app"
    },
    web: {
      favicon: "./assets/logo.png"
    },
    extra: {
      eas: {
        projectId: "da981f7b-2997-47f9-834b-75ad68a16034"
      }
    }
  }
};

