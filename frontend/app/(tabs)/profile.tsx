
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { api } from '../../core/api';
import { supabase } from '../../core/supabase';
import { useRouter } from 'expo-router';
import { User, Target, LogOut, Edit3, ChevronRight, X, Check } from 'lucide-react-native';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [targets, setTargets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  
  // Edit Targets Modal
  const [editTargetsModalVisible, setEditTargetsModalVisible] = useState(false);
  const [editTargets, setEditTargets] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    water: ''
  });
  const [savingTargets, setSavingTargets] = useState(false);
  
  // Edit Profile Modal
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editProfile, setEditProfile] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    activity: '',
    goal: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/profile/');
      setProfile(res);
      
      if (res) {
        setEditProfile({
          name: res.name || '',
          age: String(res.age || ''),
          height: String(res.height_cm || ''),
          weight: String(res.weight_kg || ''),
          activity: res.activity_level || 'medium',
          goal: res.goal_type || 'maintain'
        });
      }
      
      const targetsRes = await api.get('/api/profile/targets');
      setTargets(targetsRes);
      
      if (targetsRes) {
        setEditTargets({
          calories: String(targetsRes.calories_target || 2000),
          protein: String(targetsRes.protein_target_g || 120),
          carbs: String(targetsRes.carbs_target_g || 250),
          fats: String(targetsRes.fats_target_g || 60),
          water: String(targetsRes.water_target_ml || 3000)
        });
      }
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSignOut = () => {
    showConfirm('Sign Out', 'Are you sure you want to sign out?', async () => {
      setSigningOut(true);
      try {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
      } catch (e) {
        console.error('Sign out error:', e);
        showToast('Failed to sign out', 'error');
      } finally {
        setSigningOut(false);
      }
    });
  };

  const handleSaveTargets = async () => {
    setSavingTargets(true);
    try {
      await api.put('/api/profile/targets', {
        calories_target: parseInt(editTargets.calories) || 2000,
        protein_target_g: parseInt(editTargets.protein) || 120,
        carbs_target_g: parseInt(editTargets.carbs) || 250,
        fats_target_g: parseInt(editTargets.fats) || 60,
        water_target_ml: parseInt(editTargets.water) || 3000
      });
      showToast('Targets updated successfully!', 'success');
      setEditTargetsModalVisible(false);
      fetchProfile();
    } catch (e) {
      console.error('Save targets error:', e);
      showToast('Failed to update targets', 'error');
    } finally {
      setSavingTargets(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put('/api/profile/', {
        name: editProfile.name || null,
        age: parseInt(editProfile.age) || null,
        height_cm: parseInt(editProfile.height) || null,
        weight_kg: parseFloat(editProfile.weight) || null,
        activity_level: editProfile.activity,
        goal_type: editProfile.goal
      });
      showToast('Profile updated successfully!', 'success');
      setEditProfileModalVisible(false);
      fetchProfile();
    } catch (e) {
      console.error('Save profile error:', e);
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const activityLabels: Record<string, string> = {
    low: 'Light',
    medium: 'Moderate', 
    high: 'Very Active'
  };

  const goalLabels: Record<string, string> = {
    fat_loss: 'Lose Fat',
    maintain: 'Maintain',
    muscle_gain: 'Build Muscle'
  };

  const activities = [
    { id: 'low', label: 'Light' },
    { id: 'medium', label: 'Moderate' },
    { id: 'high', label: 'Very Active' }
  ];

  const goals = [
    { id: 'fat_loss', label: 'Lose Fat' },
    { id: 'maintain', label: 'Maintain' },
    { id: 'muscle_gain', label: 'Build Muscle' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.headerTitle}>Settings</Text>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={() => setEditProfileModalVisible(true)}>
          <View style={styles.avatarContainer}>
            <User color="#22c55e" size={32} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
          </View>
          <View style={styles.editBtn}>
            <Edit3 color="#6b7280" size={20} />
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <TouchableOpacity style={styles.statsRow} onPress={() => setEditProfileModalVisible(true)}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.age || '--'}</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.height_cm || '--'}</Text>
            <Text style={styles.statLabel}>Height (cm)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{profile?.weight_kg || '--'}</Text>
            <Text style={styles.statLabel}>Weight (kg)</Text>
          </View>
        </TouchableOpacity>

        {/* Activity & Goal */}
        <View style={styles.badgesRow}>
          <TouchableOpacity style={styles.badge} onPress={() => setEditProfileModalVisible(true)}>
            <Text style={styles.badgeLabel}>Activity</Text>
            <Text style={styles.badgeValue}>{activityLabels[profile?.activity_level] || 'Not set'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.badge} onPress={() => setEditProfileModalVisible(true)}>
            <Text style={styles.badgeLabel}>Goal</Text>
            <Text style={styles.badgeValue}>{goalLabels[profile?.goal_type] || 'Not set'}</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Targets Section */}
        <View style={styles.sectionHeader}>
          <Target color="#22c55e" size={20} />
          <Text style={styles.sectionTitle}>Daily Targets</Text>
          <TouchableOpacity onPress={() => setEditTargetsModalVisible(true)} style={styles.editLink}>
            <Text style={styles.editLinkText}>Edit</Text>
            <ChevronRight color="#22c55e" size={18} />
          </TouchableOpacity>
        </View>

        <View style={styles.targetsGrid}>
          <View style={styles.targetCard}>
            <Text style={styles.targetValue}>{targets?.calories_target?.toLocaleString() || '--'}</Text>
            <Text style={styles.targetLabel}>Calories</Text>
          </View>
          <View style={styles.targetCard}>
            <Text style={styles.targetValue}>{targets?.protein_target_g || '--'}g</Text>
            <Text style={styles.targetLabel}>Protein</Text>
          </View>
          <View style={styles.targetCard}>
            <Text style={styles.targetValue}>{targets?.carbs_target_g || '--'}g</Text>
            <Text style={styles.targetLabel}>Carbs</Text>
          </View>
          <View style={styles.targetCard}>
            <Text style={styles.targetValue}>{targets?.fats_target_g || '--'}g</Text>
            <Text style={styles.targetLabel}>Fats</Text>
          </View>
          <View style={[styles.targetCard, { flex: 2 }]}>
            <Text style={styles.targetValue}>{((targets?.water_target_ml || 0) / 1000).toFixed(1)}L</Text>
            <Text style={styles.targetLabel}>Water</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={[styles.signOutButton, signingOut && styles.buttonDisabled]} 
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <LogOut color="#ef4444" size={20} />
          <Text style={styles.signOutText}>{signingOut ? 'Signing out...' : 'Sign Out'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Targets Modal */}
      <Modal visible={editTargetsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Daily Targets</Text>
              <TouchableOpacity onPress={() => setEditTargetsModalVisible(false)}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'calories', label: 'Calories (kcal)', value: editTargets.calories },
                { key: 'protein', label: 'Protein (g)', value: editTargets.protein },
                { key: 'carbs', label: 'Carbs (g)', value: editTargets.carbs },
                { key: 'fats', label: 'Fats (g)', value: editTargets.fats },
                { key: 'water', label: 'Water (ml)', value: editTargets.water },
              ].map(item => (
                <View key={item.key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{item.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={item.value}
                    onChangeText={(v) => setEditTargets(prev => ({ ...prev, [item.key]: v }))}
                    keyboardType="numeric"
                    placeholderTextColor="#6b7280"
                  />
                </View>
              ))}

              <TouchableOpacity 
                style={[styles.saveButton, savingTargets && styles.buttonDisabled]} 
                onPress={handleSaveTargets}
                disabled={savingTargets}
              >
                <Text style={styles.saveButtonText}>{savingTargets ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editProfile.name}
                  onChangeText={(v) => setEditProfile(prev => ({ ...prev, name: v }))}
                  placeholder="Your name"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.input}
                    value={editProfile.age}
                    onChangeText={(v) => setEditProfile(prev => ({ ...prev, age: v }))}
                    keyboardType="numeric"
                    placeholder="e.g. 25"
                    placeholderTextColor="#6b7280"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={editProfile.weight}
                    onChangeText={(v) => setEditProfile(prev => ({ ...prev, weight: v }))}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 70"
                    placeholderTextColor="#6b7280"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={editProfile.height}
                  onChangeText={(v) => setEditProfile(prev => ({ ...prev, height: v }))}
                  keyboardType="numeric"
                  placeholder="e.g. 175"
                  placeholderTextColor="#6b7280"
                />
              </View>

              <Text style={styles.sectionLabel}>Activity Level</Text>
              <View style={styles.optionRow}>
                {activities.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.optionBtn, editProfile.activity === a.id && styles.optionBtnActive]}
                    onPress={() => setEditProfile(prev => ({ ...prev, activity: a.id }))}
                  >
                    <Text style={[styles.optionText, editProfile.activity === a.id && styles.optionTextActive]}>
                      {a.label}
                    </Text>
                    {editProfile.activity === a.id && <Check color="#0a1a15" size={14} />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Goal</Text>
              <View style={styles.optionRow}>
                {goals.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.optionBtn, editProfile.goal === g.id && styles.optionBtnActive]}
                    onPress={() => setEditProfile(prev => ({ ...prev, goal: g.id }))}
                  >
                    <Text style={[styles.optionText, editProfile.goal === g.id && styles.optionTextActive]}>
                      {g.label}
                    </Text>
                    {editProfile.goal === g.id && <Check color="#0a1a15" size={14} />}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, savingProfile && styles.buttonDisabled]} 
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={styles.saveButtonText}>{savingProfile ? 'Saving...' : 'Save Profile'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  content: { padding: 20, paddingBottom: 100 },
  
  // Header
  headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  
  // Profile Card
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2920', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f3d32', marginBottom: 20 },
  avatarContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(34, 197, 94, 0.2)', justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  profileEmail: { color: '#6b7280', marginTop: 2 },
  editBtn: { padding: 8 },
  
  // Stats Row
  statsRow: { flexDirection: 'row', backgroundColor: '#0f2920', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#1f3d32' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#1f3d32' },
  
  // Badges
  badgesRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  badge: { flex: 1, backgroundColor: '#0f2920', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1f3d32' },
  badgeLabel: { color: '#6b7280', fontSize: 12 },
  badgeValue: { color: '#22c55e', fontSize: 16, fontWeight: '600', marginTop: 4 },
  
  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', flex: 1 },
  editLink: { flexDirection: 'row', alignItems: 'center' },
  editLinkText: { color: '#22c55e', fontWeight: '600' },
  
  // Targets Grid
  targetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  targetCard: { flex: 1, minWidth: '45%', backgroundColor: '#0f2920', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f3d32' },
  targetValue: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  targetLabel: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  
  // Sign Out
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', gap: 8 },
  signOutText: { color: '#ef4444', fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f2920', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#1f3d32', maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#1f3d32', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#9ca3af', marginBottom: 8 },
  input: { backgroundColor: '#153528', borderRadius: 12, padding: 16, color: '#ffffff', fontSize: 16, borderWidth: 1, borderColor: '#1f3d32' },
  saveButton: { backgroundColor: '#22c55e', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  saveButtonText: { color: '#0a1a15', fontWeight: 'bold', fontSize: 16 },
  
  // Row inputs
  rowInputs: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfInput: { flex: 1 },
  
  // Option buttons
  sectionLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  optionBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#1f3d32', backgroundColor: '#153528', flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionBtnActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  optionText: { color: '#6b7280', fontWeight: '600' },
  optionTextActive: { color: '#0a1a15' },
});
