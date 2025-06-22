import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaWrapper } from '../../src/components/SafeAreaWrapper';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Avatar } from '../../src/components/Avatar';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export default function ProfileTab() {
  const { colors, toggleTheme } = useTheme();

  const handleEditProfile = () => {
    console.log('Edit profile functionality - Phase 6');
  };

  const handleSettings = () => {
    console.log('Settings functionality - Phase 6');
  };

  const handleViewStats = () => {
    console.log('View stats functionality - Phase 6');
  };

  return (
    <SafeAreaWrapper variant="full">
      <Header 
        title="Profile" 
        rightActions={[
          {
            icon: 'settings',
            onPress: handleSettings,
            badge: false,
          },
        ]}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              size="xl"
              fallbackText="Travel User"
              variant="circular"
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.text.primary }]}>
                Travel User
              </Text>
              <Text style={[styles.email, { color: colors.text.secondary }]}>
                user@traveljournal.app
              </Text>
            </View>
          </View>
          
          <Button
            title="Edit Profile"
            variant="secondary"
            onPress={handleEditProfile}
            style={styles.editButton}
          />
        </Card>

        {/* Stats Card */}
        <Card variant="elevated" style={styles.statsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Travel Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="airplane" size="lg" color={colors.primary[500]} />
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                12
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Trips
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="map-pin" size="lg" color={colors.secondary[500]} />
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                48
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Places
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="camera" size="lg" color={colors.accent[500]} />
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                324
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Photos
              </Text>
            </View>
          </View>
          <Button
            title="View Detailed Stats"
            variant="ghost"
            onPress={handleViewStats}
            style={styles.viewStatsButton}
          />
        </Card>

        {/* Quick Actions */}
        <Card variant="elevated" style={styles.actionsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsList}>
            <Button
              title="Toggle Theme"
              variant="ghost"
              onPress={toggleTheme}
              style={styles.actionButton}
            />
            <Button
              title="Export Data"
              variant="ghost"
              onPress={() => console.log('Export data - Phase 6')}
              style={styles.actionButton}
            />
            <Button
              title="Privacy Settings"
              variant="ghost"
              onPress={() => console.log('Privacy settings - Phase 6')}
              style={styles.actionButton}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  profileCard: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.styles.h3,
    marginBottom: SPACING.xs,
  },
  email: {
    ...TYPOGRAPHY.styles.body,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  statsCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...TYPOGRAPHY.styles.h2,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.styles.caption,
  },
  viewStatsButton: {
    alignSelf: 'center',
  },
  actionsCard: {
    marginBottom: SPACING.xl,
  },
  actionsList: {
    gap: SPACING.xs,
  },
  actionButton: {
    justifyContent: 'flex-start',
  },
}); 