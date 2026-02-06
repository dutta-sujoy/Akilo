
import { Tabs } from 'expo-router';
import { Home, Utensils, TrendingUp, User, ClipboardList } from 'lucide-react-native';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Modern floating tab bar with glow effect
const TabIcon = ({ icon: Icon, label, color, focused }: { 
  icon: any; 
  label: string; 
  color: string; 
  focused: boolean;
}) => (
  <View style={styles.tabItem}>
    <View style={styles.iconWrapper}>
      <Icon color={focused ? '#22c55e' : '#6b7280'} size={22} strokeWidth={focused ? 2.5 : 2} />
    </View>
    <Text style={[
      styles.tabLabel, 
      { color: focused ? '#22c55e' : '#6b7280' },
      focused && styles.tabLabelActive
    ]}>
      {label}
    </Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 12,
          right: 12,
          backgroundColor: 'rgba(15, 41, 32, 0.95)',
          borderRadius: 24,
          height: 68,
          paddingBottom: 0,
          paddingTop: 0,
          paddingHorizontal: 4,
          borderWidth: 1,
          borderColor: 'rgba(34, 197, 94, 0.2)',
          elevation: 12,
          shadowColor: '#22c55e',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Home} label="Home" color={color} focused={focused} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="food" 
        options={{
          title: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Utensils} label="Add" color={color} focused={focused} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{
          title: 'Log',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ClipboardList} label="Log" color={color} focused={focused} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={TrendingUp} label="Stats" color={color} focused={focused} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={User} label="Me" color={color} focused={focused} />
          ),
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flex: 1,
    paddingVertical: 6,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    transform: [{ scale: 1.2 }],
  },
  iconWrapper: {
    width: 44,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapperActive: {
    backgroundColor: '#22c55e',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
