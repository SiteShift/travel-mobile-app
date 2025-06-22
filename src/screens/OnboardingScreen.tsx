import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: string;
  color: string;
}

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  granted?: boolean;
}

export interface OnboardingScreenProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'location',
      title: 'Location Access',
      description: 'Add locations to your travel entries and view them on the map',
      icon: 'map-pin',
      required: true,
      granted: false,
    },
    {
      id: 'camera',
      title: 'Camera & Photos',
      description: 'Capture and add photos to your travel memories',
      icon: 'camera',
      required: false,
      granted: false,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Get reminders to document your travels',
      icon: 'bell',
      required: false,
      granted: false,
    },
  ]);

  const flatListRef = useRef<FlatList>(null);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to TravelJournal',
      subtitle: 'Your Travel Companion',
      description: 'Document your adventures, share your stories, and create lasting memories of your journeys around the world.',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop',
      icon: 'map',
      color: colors.primary[500],
    },
    {
      id: 'capture',
      title: 'Capture Every Moment',
      subtitle: 'Rich Media Support',
      description: 'Add photos, videos, and detailed descriptions to create comprehensive travel entries.',
      image: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=300&h=200&fit=crop',
      icon: 'camera',
      color: colors.secondary[500],
    },
    {
      id: 'explore',
      title: 'Explore on the Map',
      subtitle: 'Visual Journey',
      description: 'View all your travel memories on an interactive map and discover new places to visit.',
      image: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=300&h=200&fit=crop',
      icon: 'globe',
      color: colors.info[500],
    },
    {
      id: 'share',
      title: 'Share Your Adventures',
      subtitle: 'Connect & Inspire',
      description: 'Share your travel stories with friends and family, and inspire others to explore the world.',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop',
      icon: 'share',
      color: colors.success[500],
    },
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
    }
  };

  const handlePermissionRequest = async (permissionId: string) => {
    // Simulate permission request
    setTimeout(() => {
      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, granted: true } : p
      ));
    }, 1000);
  };

  const handleGetStarted = () => {
    onComplete?.();
  };

  const renderOnboardingStep = ({ item }: { item: OnboardingStep }) => (
    <View style={[styles.stepContainer, { width: SCREEN_WIDTH }]}>
      <View style={styles.stepContent}>
        {/* Image */}
        <View style={[styles.imageContainer, { backgroundColor: item.color + '20' }]}>
          <Image
            source={{ uri: item.image }}
            style={styles.stepImage}
            resizeMode="cover"
          />
          <View style={[styles.iconOverlay, { backgroundColor: item.color }]}>
            <Icon name={item.icon} size="lg" color={colors.text.inverse} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.stepSubtitle, { color: item.color }]}>
            {item.subtitle}
          </Text>
          <Text style={[styles.stepDescription, { color: colors.text.secondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingSteps.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentStep 
                ? colors.primary[500] 
                : colors.neutral[300],
              width: index === currentStep ? 24 : 8,
            }
          ]}
          onPress={() => {
            setCurrentStep(index);
            flatListRef.current?.scrollToIndex({ index, animated: true });
          }}
        />
      ))}
    </View>
  );

  const renderPermissionsStep = () => (
    <View style={styles.permissionsContainer}>
      <View style={styles.permissionsHeader}>
        <Text style={[styles.permissionsTitle, { color: colors.text.primary }]}>
          Allow Permissions
        </Text>
        <Text style={[styles.permissionsSubtitle, { color: colors.text.secondary }]}>
          Enable these features to get the most out of TravelJournal
        </Text>
      </View>

      <View style={styles.permissionsList}>
        {permissions.map((permission) => (
          <View
            key={permission.id}
            style={[
              styles.permissionItem,
              { backgroundColor: colors.surface.secondary }
            ]}
          >
            <View style={styles.permissionLeft}>
              <View
                style={[
                  styles.permissionIcon,
                  {
                    backgroundColor: permission.granted 
                      ? colors.success[100] 
                      : colors.neutral[100]
                  }
                ]}
              >
                <Icon
                  name={permission.granted ? 'check' : permission.icon}
                  size="md"
                  color={permission.granted ? colors.success[500] : colors.text.secondary}
                />
              </View>
              
              <View style={styles.permissionText}>
                <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
                  {permission.title}
                  {permission.required && (
                    <Text style={{ color: colors.error[500] }}> *</Text>
                  )}
                </Text>
                <Text style={[styles.permissionDescription, { color: colors.text.secondary }]}>
                  {permission.description}
                </Text>
              </View>
            </View>

            {!permission.granted && (
              <Button
                title="Allow"
                variant="primary"
                size="small"
                onPress={() => handlePermissionRequest(permission.id)}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.permissionsFooter}>
        <Text style={[styles.permissionsNote, { color: colors.text.tertiary }]}>
          * Required permissions. You can change these settings later in your device settings.
        </Text>
      </View>
    </View>
  );

  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isPermissionsStep = currentStep >= onboardingSteps.length;
  const allRequiredPermissionsGranted = permissions
    .filter(p => p.required)
    .every(p => p.granted);

  if (isPermissionsStep) {
    return (
      <SafeAreaWrapper variant="full">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setCurrentStep(currentStep - 1)}>
              <Icon name="arrow-left" size="md" color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkip}>
              <Text style={[styles.skipText, { color: colors.text.secondary }]}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          {renderPermissionsStep()}

          <View style={styles.footer}>
            <Button
              title="Get Started"
              variant="primary"
              size="large"
              onPress={handleGetStarted}
              disabled={!allRequiredPermissionsGranted}
              style={styles.actionButton}
            />
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper variant="full">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={currentStep === 0 ? onSkip : handlePrevious}
            style={styles.headerButton}
          >
            <Icon 
              name={currentStep === 0 ? 'x' : 'arrow-left'} 
              size="md" 
              color={colors.text.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onSkip}>
            <Text style={[styles.skipText, { color: colors.text.secondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <FlatList
          ref={flatListRef}
          data={onboardingSteps}
          renderItem={renderOnboardingStep}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentStep(newIndex);
          }}
          style={styles.carousel}
        />

        {/* Dots */}
        {renderDots()}

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={isLastStep ? 'Continue' : 'Next'}
            variant="primary"
            size="large"
            onPress={isLastStep ? () => setCurrentStep(currentStep + 1) : handleNext}
            style={styles.actionButton}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  skipText: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '500',
  },
  carousel: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  stepContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  textContent: {
    alignItems: 'center',
  },
  stepTitle: {
    ...TYPOGRAPHY.styles.h1,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  stepSubtitle: {
    ...TYPOGRAPHY.styles.h4,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  stepDescription: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  actionButton: {
    width: '100%',
  },
  
  // Permissions step styles
  permissionsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  permissionsHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  permissionsTitle: {
    ...TYPOGRAPHY.styles.h1,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  permissionsSubtitle: {
    ...TYPOGRAPHY.styles.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionsList: {
    gap: SPACING.md,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  permissionDescription: {
    ...TYPOGRAPHY.styles.bodySmall,
    lineHeight: 18,
  },
  permissionsFooter: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  permissionsNote: {
    ...TYPOGRAPHY.styles.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
}); 