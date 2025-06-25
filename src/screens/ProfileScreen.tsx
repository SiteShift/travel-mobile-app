import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { UserStatsDashboard, UserStats } from '../components/UserStatsDashboard';
import { SettingsList, SettingsSection, QuickAction } from '../components/SettingsList';
import {
  SPACING,
  TYPOGRAPHY,
} from '../constants/theme';

export const ProfileScreen = () => {
  const { colors, isDark, toggleTheme, mode } = useTheme();
  const [user, setUser] = useState({
    name: 'Alex Thompson',
    email: 'alex.thompson@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    verified: true,
    premium: false,
    joinDate: new Date('2023-01-15'),
  });

  const [stats] = useState<UserStats>({
    totalTrips: 12,
    totalEntries: 89,
    totalPhotos: 247,
    totalCountries: 8,
    totalDays: 45,
    totalWords: 12450,
    streakDays: 7,
    level: 5,
    experience: 850,
    nextLevelExp: 1000,
  });

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing functionality');
  };

  const handleShareProfile = () => {
    Alert.alert('Share Profile', 'Profile sharing functionality');
  };

  const handleViewAchievements = () => {
    Alert.alert('Achievements', 'Achievements view functionality');
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export functionality');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Help & support functionality');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: 'user',
          type: 'navigation',
          onPress: handleEditProfile,
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Control who can see your content',
          icon: 'shield',
          type: 'navigation',
          onPress: () => Alert.alert('Privacy', 'Privacy settings'),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Manage your notification preferences',
          icon: 'bell',
          type: 'navigation',
          onPress: () => Alert.alert('Notifications', 'Notification settings'),
        },
      ],
    },
    {
      id: 'app',
      title: 'App Settings',
      items: [
        {
          id: 'language',
          title: 'Language',
          subtitle: 'Choose your preferred language',
          icon: 'globe',
          type: 'navigation',
          value: 'English',
          onPress: () => Alert.alert('Language', 'Language selection'),
        },
        {
          id: 'export',
          title: 'Export Data',
          subtitle: 'Download your travel data',
          icon: 'download',
          type: 'navigation',
          onPress: handleExportData,
        },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with using the app',
          icon: 'help-circle',
          type: 'navigation',
          onPress: handleSupport,
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve the app',
          icon: 'message-circle',
          type: 'navigation',
          onPress: () => Alert.alert('Feedback', 'Feedback form'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          icon: 'info',
          type: 'navigation',
          value: 'v1.0.0',
          onPress: () => Alert.alert('About', 'App information'),
        },
      ],
    },
    {
      id: 'account-actions',
      items: [
        {
          id: 'sign-out',
          title: 'Sign Out',
          icon: 'log-out',
          type: 'button',
          destructive: true,
          onPress: handleSignOut,
        },
      ],
    },
  ];

  const quickActions = [
    {
      icon: 'edit',
      title: 'Edit Profile',
      onPress: handleEditProfile,
      color: colors.primary[500],
    },
    {
      icon: 'share',
      title: 'Share',
      onPress: handleShareProfile,
      color: colors.secondary[500],
    },
    {
      icon: 'award',
      title: 'Achievements',
      onPress: handleViewAchievements,
      color: colors.warning[500],
    },
    {
      icon: 'download',
      title: 'Export',
      onPress: handleExportData,
      color: colors.info[500],
    },
  ];

  const renderProfileHeader = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <Avatar
          source={{ uri: user.avatar }}
          fallbackText={user.name}
          size="xl"
          style={styles.avatar}
        />
        
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text.primary }]}>
              {user.name}
            </Text>
            {user.verified && (
              <Icon name="verified" size="sm" color={colors.success[500]} />
            )}
            {user.premium && (
              <Icon name="star" size="sm" color={colors.warning[500]} />
            )}
          </View>
          
          <Text style={[styles.userEmail, { color: colors.text.secondary }]}>
            {user.email}
          </Text>
          
          <Text style={[styles.memberSince, { color: colors.text.tertiary }]}>
            Member since {user.joinDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>
      </View>
      
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <QuickAction
            key={index}
            icon={action.icon}
            title={action.title}
            color={action.color}
            onPress={action.onPress}
          />
        ))}
      </View>
    </Card>
  );

  const renderThemeSettings = () => (
    <Card style={styles.themeCard}>
      <View style={styles.themeHeader}>
        <View style={styles.themeIconContainer}>
          <Icon 
            name={isDark ? 'moon' : 'sun'} 
            size="lg" 
            color={isDark ? colors.primary[400] : colors.warning[500]} 
          />
        </View>
        <View style={styles.themeInfo}>
          <Text style={[styles.themeTitle, { color: colors.text.primary }]}>
            Appearance
          </Text>
          <Text style={[styles.themeSubtitle, { color: colors.text.secondary }]}>
            Choose your preferred theme
          </Text>
        </View>
      </View>
      
      <View style={styles.themeOptions}>
        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: colors.surface.secondary },
            !isDark && [styles.themeOptionActive, { backgroundColor: colors.primary[100], borderColor: colors.primary[500] }]
          ]}
          onPress={() => !isDark || toggleTheme()}
          activeOpacity={0.7}
        >
          <View style={[styles.themePreview, { backgroundColor: '#ffffff' }]}>
            <View style={[styles.themePreviewHeader, { backgroundColor: '#f8fafc' }]} />
            <View style={styles.themePreviewContent}>
              <View style={[styles.themePreviewLine, { backgroundColor: '#1e293b' }]} />
              <View style={[styles.themePreviewLine, { backgroundColor: '#64748b', width: '60%' }]} />
            </View>
          </View>
          <View style={styles.themeOptionInfo}>
            <Text style={[styles.themeOptionTitle, { color: colors.text.primary }]}>
              Light Mode
            </Text>
            <Text style={[styles.themeOptionSubtitle, { color: colors.text.secondary }]}>
              Clean and bright
            </Text>
          </View>
          {!isDark && (
            <View style={[styles.themeCheckmark, { backgroundColor: colors.primary[500] }]}>
              <Icon name="checkmark" size="sm" color="white" />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: colors.surface.secondary },
            isDark && [styles.themeOptionActive, { backgroundColor: colors.primary[100], borderColor: colors.primary[500] }]
          ]}
          onPress={() => isDark || toggleTheme()}
          activeOpacity={0.7}
        >
          <View style={[styles.themePreview, { backgroundColor: '#0f172a' }]}>
            <View style={[styles.themePreviewHeader, { backgroundColor: '#1e293b' }]} />
            <View style={styles.themePreviewContent}>
              <View style={[styles.themePreviewLine, { backgroundColor: '#f8fafc' }]} />
              <View style={[styles.themePreviewLine, { backgroundColor: '#cbd5e1', width: '60%' }]} />
            </View>
          </View>
          <View style={styles.themeOptionInfo}>
            <Text style={[styles.themeOptionTitle, { color: colors.text.primary }]}>
              Dark Mode
            </Text>
            <Text style={[styles.themeOptionSubtitle, { color: colors.text.secondary }]}>
              Easy on the eyes
            </Text>
          </View>
          {isDark && (
            <View style={[styles.themeCheckmark, { backgroundColor: colors.primary[500] }]}>
              <Icon name="checkmark" size="sm" color="white" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaWrapper variant="top">
      <Header
        title="Profile"
        variant="default"
        rightActions={[
          {
            icon: 'settings',
            onPress: () => Alert.alert('Settings', 'Advanced settings'),
          },
        ]}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Your Travel Stats
          </Text>
          <UserStatsDashboard stats={stats} compact />
        </View>
        
        {renderThemeSettings()}
        
        <SettingsList sections={settingsSections} />
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  userName: {
    ...TYPOGRAPHY.styles.h3,
    fontWeight: '600',
  },
  userEmail: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.xs,
  },
  memberSince: {
    ...TYPOGRAPHY.styles.caption,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
  // Theme Settings Styles
  themeCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    ...TYPOGRAPHY.styles.h3,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  themeSubtitle: {
    ...TYPOGRAPHY.styles.body,
  },
  themeOptions: {
    gap: SPACING.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  themeOptionActive: {
    borderWidth: 2,
  },
  themePreview: {
    width: 48,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themePreviewHeader: {
    height: 12,
    width: '100%',
  },
  themePreviewContent: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
  },
  themePreviewLine: {
    height: 2,
    borderRadius: 1,
  },
  themeOptionInfo: {
    flex: 1,
  },
  themeOptionTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeOptionSubtitle: {
    ...TYPOGRAPHY.styles.bodySmall,
  },
  themeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 