import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  const { colors, isDark, toggleTheme } = useTheme();
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
          id: 'theme',
          title: 'Dark Mode',
          subtitle: 'Switch between light and dark themes',
          icon: 'moon',
          type: 'toggle',
          value: isDark,
          onToggle: toggleTheme,
        },
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
}); 