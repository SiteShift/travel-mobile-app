import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { Button, Input, Card, Avatar, Badge, LoadingSpinner, Modal, Icon, Header, FloatingActionButton, SafeAreaWrapper, TabBar, SearchBar } from './src/components';
import { SPACING, TYPOGRAPHY } from './src/constants/theme';

const AppContent: React.FC = () => {
  const { colors, toggleTheme, mode } = useTheme();
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [bioValue, setBioValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [searchValue, setSearchValue] = useState('');

  return (
    <SafeAreaWrapper style={{ backgroundColor: colors.surface.primary }}>
      <Header
        title="Travel Diary App"
        subtitle={`Design System Demo - ${mode} mode`}
        variant="elevated"
        rightActions={[
          {
            icon: mode === 'dark' ? 'sun' : 'moon',
            onPress: toggleTheme,
            accessibilityLabel: `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`,
          },
        ]}
        testID="main-header"
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

        {/* Button Variants */}
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Button Components
          </Text>
          <View style={styles.buttonGroup}>
            <Button
              title="Primary Button"
              onPress={() => console.log('Primary pressed')}
              variant="primary"
              style={styles.button}
            />
            <Button
              title="Secondary Button"
              onPress={() => console.log('Secondary pressed')}
              variant="secondary"
              style={styles.button}
            />
            <Button
              title="Ghost Button"
              onPress={() => console.log('Ghost pressed')}
              variant="ghost"
              style={styles.button}
            />
          </View>
        </Card>

        {/* Input Components */}
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Input Components
          </Text>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={emailValue}
            onChangeText={setEmailValue}
            variant="outlined"
            keyboardType="email-address"
            helperText="We'll never share your email"
            required
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={passwordValue}
            onChangeText={setPasswordValue}
            variant="filled"
            secureTextEntry
            helperText="Must be at least 8 characters"
          />
          <Input
            label="Bio"
            placeholder="Tell us about yourself..."
            value={bioValue}
            onChangeText={setBioValue}
            variant="outlined"
            multiline
            numberOfLines={3}
            maxLength={200}
            showCharacterCount
            helperText="Share your travel experiences"
          />
        </Card>

        {/* Card Variants */}
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Card Components
          </Text>
          
          <Card variant="outlined" margin="sm">
            <Text style={[styles.cardText, { color: colors.text.primary }]}>
              Outlined Card
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.text.secondary }]}>
              Perfect for content sections
            </Text>
          </Card>

          <Card variant="filled" margin="sm">
            <Text style={[styles.cardText, { color: colors.text.primary }]}>
              Filled Card
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.text.secondary }]}>
              Great for highlighted content
            </Text>
          </Card>

          <Card 
            variant="elevated" 
            margin="sm"
            onPress={() => console.log('Tappable card pressed')}
          >
            <Text style={[styles.cardText, { color: colors.text.primary }]}>
              Elevated Tappable Card
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.text.secondary }]}>
              Tap me! Perfect for interactive elements
            </Text>
          </Card>
                 </Card>

        {/* Avatar & Badge Components */}
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Avatar & Badge Components
          </Text>
          
          <View style={styles.avatarRow}>
            <Avatar
              size="xs"
              fallbackText="JD"
              testID="avatar-xs"
            />
            <Avatar
              size="sm"
              fallbackText="Jane Doe"
              testID="avatar-sm"
            />
            <Avatar
              size="md"
              fallbackText="Travel Enthusiast"
              showBadge
              testID="avatar-md"
            />
            <Avatar
              size="lg"
              fallbackText="Adventure Guide"
              variant="rounded"
              showBadge
              badgeColor={colors.warning[500]}
              testID="avatar-lg"
            />
            <Avatar
              size="xl"
              fallbackText="Explorer"
              variant="square"
              onPress={() => console.log('Avatar tapped')}
              testID="avatar-xl"
            />
          </View>

          <View style={styles.badgeContainer}>
            <Badge label="Travel" variant="primary" />
            <Badge label="Adventure" variant="secondary" outlined />
            <Badge label="Nature" variant="success" size="small" />
            <Badge 
              label="Photography" 
              variant="warning" 
              removable 
              onRemove={() => console.log('Badge removed')}
            />
            <Badge 
              label="Backpacking" 
              variant="info" 
              size="large"
              onPress={() => console.log('Badge tapped')}
            />
            <Badge label="Explore" variant="error" outlined size="small" />
          </View>
        </Card>

        {/* Loading Components */}
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Loading Components
          </Text>
          
          <View style={styles.loadingRow}>
            <LoadingSpinner
              size="small"
              message="Small"
              testID="loading-small"
            />
            <LoadingSpinner
              size="medium"
              message="Medium"
              testID="loading-medium"
            />
            <LoadingSpinner
              size="large"
              message="Large"
              testID="loading-large"
            />
          </View>

          <View style={styles.loadingRow}>
            <LoadingSpinner
              variant="inline"
              size="small"
              message="Loading..."
              testID="loading-inline"
            />
            <LoadingSpinner
              variant="minimal"
              size="medium"
              testID="loading-minimal"
            />
          </View>

          <Text style={[styles.cardSubtext, { color: colors.text.secondary, marginTop: SPACING.sm }]}>
            Tap theme button to see loading states in action
          </Text>
        </Card>

        {/* Modal & Icon Components */}
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Modal & Icon Components
          </Text>
          
          <View style={styles.modalButtonRow}>
            <Button
              title="Center Modal"
              onPress={() => setModalVisible(true)}
              variant="primary"
              size="small"
            />
            <Button
              title="Bottom Sheet"
              onPress={() => setBottomSheetVisible(true)}
              variant="secondary"
              size="small"
            />
          </View>

          <View style={styles.iconGrid}>
            <View style={styles.iconItem}>
              <Icon name="map" size="lg" color="primary" />
              <Text style={[styles.iconLabel, { color: colors.text.secondary }]}>Map</Text>
            </View>
            <View style={styles.iconItem}>
              <Icon name="camera" size="lg" color="success" />
              <Text style={[styles.iconLabel, { color: colors.text.secondary }]}>Camera</Text>
            </View>
            <View style={styles.iconItem}>
              <Icon name="airplane" size="lg" color="info" />
              <Text style={[styles.iconLabel, { color: colors.text.secondary }]}>Travel</Text>
            </View>
            <View style={styles.iconItem}>
              <Icon name="mountain" size="lg" color="warning" />
              <Text style={[styles.iconLabel, { color: colors.text.secondary }]}>Adventure</Text>
            </View>
            <View style={styles.iconItem}>
              <Icon name="journal" size="lg" color="secondary" />
              <Text style={[styles.iconLabel, { color: colors.text.secondary }]}>Journal</Text>
            </View>
            <View style={styles.iconItem}>
              <Icon name="heart" size="lg" color="error" />
              <Text style={[styles.iconLabel, { color: colors.text.secondary }]}>Favorite</Text>
            </View>
          </View>
        </Card>

        {/* Layout Components Demo */}
        <Card variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Layout Components
          </Text>
          
          <Text style={[styles.cardSubtext, { color: colors.text.secondary, marginBottom: SPACING.md }]}>
            Header: Elevated variant with theme toggle action (see top)
          </Text>
          
          <Text style={[styles.cardSubtext, { color: colors.text.secondary, marginBottom: SPACING.md }]}>
            SafeAreaWrapper: Handles device safe areas automatically
          </Text>
          
          <Text style={[styles.cardSubtext, { color: colors.text.secondary, marginBottom: SPACING.md }]}>
            FloatingActionButton: Expandable FAB with travel actions (see bottom-right)
          </Text>
          
          <View style={styles.headerDemo}>
            <Header
              title="Sample Trip"
              subtitle="Paris Adventure"
              variant="default"
              size="compact"
              showBackButton
              onBackPress={() => console.log('Back pressed')}
              rightActions={[
                {
                  icon: 'share',
                  onPress: () => console.log('Share pressed'),
                  accessibilityLabel: 'Share trip',
                },
                {
                  icon: 'heart',
                  onPress: () => console.log('Favorite pressed'),
                  accessibilityLabel: 'Add to favorites',
                },
              ]}
              testID="demo-header"
            />
          </View>

          <View style={styles.componentDemo}>
            <Text style={[styles.cardSubtext, { color: colors.text.secondary, marginBottom: SPACING.sm }]}>
              SearchBar with suggestions:
            </Text>
            <SearchBar
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Search destinations..."
              variant="elevated"
              leftIcon="search"
              suggestions={[
                { id: '1', title: 'Paris, France', subtitle: 'City of Light', type: 'location' },
                { id: '2', title: 'Tokyo, Japan', subtitle: 'Modern metropolis', type: 'location' },
                { id: '3', title: 'Recent: Bali', subtitle: 'Last searched', type: 'recent' },
              ]}
              onSuggestionPress={(suggestion) => {
                console.log('Selected:', suggestion.title);
                setSearchValue(suggestion.title);
              }}
              testID="demo-search"
            />
          </View>

          <View style={styles.componentDemo}>
            <Text style={[styles.cardSubtext, { color: colors.text.secondary, marginBottom: SPACING.sm }]}>
              TabBar with travel tabs:
            </Text>
            <TabBar
              tabs={[
                { key: 'map', icon: 'map', label: 'Map' },
                { key: 'trips', icon: 'backpack', label: 'Trips', badge: true },
                { key: 'camera', icon: 'camera', label: 'Capture' },
                { key: 'profile', icon: 'user', label: 'Profile' },
              ]}
              activeTab={activeTab}
              onTabPress={setActiveTab}
              variant="elevated"
              testID="demo-tabbar"
            />
          </View>
        </Card>
      </ScrollView>

      {/* Modals */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Travel Memory"
        variant="center"
        size="medium"
      >
        <View style={styles.modalContent}>
          <Icon name="photo" size="xxl" color="primary" style={styles.modalIcon} />
          <Text style={[styles.modalText, { color: colors.text.primary }]}>
            Your travel memories are precious! This modal showcases how overlays will work in the travel journal app.
          </Text>
          <Button
            title="Save Memory"
            onPress={() => setModalVisible(false)}
            variant="primary"
            style={styles.modalButton}
          />
        </View>
      </Modal>

      <Modal
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        title="Quick Actions"
        variant="bottom"
        scrollable
      >
        <View style={styles.bottomSheetContent}>
          <Button
            title="📷 Add Photo"
            onPress={() => setBottomSheetVisible(false)}
            variant="ghost"
            style={styles.sheetButton}
          />
          <Button
            title="📝 Write Entry"
            onPress={() => setBottomSheetVisible(false)}
            variant="ghost"
            style={styles.sheetButton}
          />
          <Button
            title="📍 Add Location"
            onPress={() => setBottomSheetVisible(false)}
            variant="ghost"
            style={styles.sheetButton}
          />
          <Button
            title="🏷️ Add Tags"
            onPress={() => setBottomSheetVisible(false)}
            variant="ghost"
            style={styles.sheetButton}
          />
        </View>
      </Modal>
      
      <FloatingActionButton
        icon="add"
        position="bottom-right"
        actions={[
          {
            icon: 'camera',
            onPress: () => console.log('Add photo'),
            accessibilityLabel: 'Add photo',
          },
          {
            icon: 'note',
            onPress: () => console.log('Add note'),
            accessibilityLabel: 'Add note',
          },
          {
            icon: 'location',
            onPress: () => console.log('Add location'),
            accessibilityLabel: 'Add location',
          },
        ]}
        testID="main-fab"
      />
    </SafeAreaWrapper>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.styles.h1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.styles.body,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginBottom: SPACING.md,
  },
  buttonGroup: {
    gap: SPACING.sm,
  },
  button: {
    marginBottom: SPACING.sm,
  },
  cardText: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: TYPOGRAPHY.styles.h4.fontWeight,
    marginBottom: SPACING.xs,
  },
  cardSubtext: {
    ...TYPOGRAPHY.styles.bodySmall,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  iconItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: SPACING.md,
  },
  iconLabel: {
    ...TYPOGRAPHY.styles.caption,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  modalContent: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  modalIcon: {
    marginBottom: SPACING.md,
  },
  modalText: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButton: {
    minWidth: 120,
  },
  bottomSheetContent: {
    paddingVertical: SPACING.sm,
  },
  sheetButton: {
    marginBottom: SPACING.sm,
    justifyContent: 'flex-start',
  },
  headerDemo: {
    marginTop: SPACING.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  componentDemo: {
    marginTop: SPACING.lg,
  },
});
