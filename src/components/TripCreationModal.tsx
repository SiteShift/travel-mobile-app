import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TripFormData {
  title: string;
  description: string;
  image: string | null;
  startDate: Date;
  endDate: Date;
}

interface TripFormErrors {
  title?: string;
  image?: string;
  dates?: string;
}

interface TripCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateTrip: (tripData: {
    title: string;
    description: string;
    image: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

export const TripCreationModal: React.FC<TripCreationModalProps> = ({
  visible,
  onClose,
  onCreateTrip,
}) => {
  const { colors } = useTheme();
  
  // Form state
  const [formData, setFormData] = useState<TripFormData>({
    title: '',
    description: '',
    image: null,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  const [errors, setErrors] = useState<TripFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // Animation
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setFormData({
        title: '',
        description: '',
        image: null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      setErrors({});
      setIsLoading(false);
      setIsImageLoading(false);
    }
  }, [visible]);
  
  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);
  
  // Update form data
  const updateFormData = useCallback((field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof TripFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: TripFormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Trip name is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Trip name must be at least 3 characters';
    }
    
    if (!formData.image) {
      newErrors.image = 'Cover photo is required';
    }
    
    if (formData.startDate >= formData.endDate) {
      newErrors.dates = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  // Image picker
  const handleImagePicker = useCallback(async () => {
    try {
      setIsImageLoading(true);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrors(prev => ({ ...prev, image: 'Photo access permission is required' }));
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        updateFormData('image', result.assets[0].uri);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, image: 'Failed to select image' }));
    } finally {
      setIsImageLoading(false);
    }
  }, [updateFormData]);
  
  // Handle date selection
  const handleDateSelect = useCallback((field: 'startDate' | 'endDate', increment: number) => {
    const currentDate = formData[field];
    const newDate = new Date(currentDate.getTime() + increment * 24 * 60 * 60 * 1000);
    
    // Ensure start date is not before today
    if (field === 'startDate' && newDate < new Date()) {
      return;
    }
    
    updateFormData(field, newDate);
    
    // Auto-adjust end date if needed
    if (field === 'startDate' && newDate >= formData.endDate) {
      updateFormData('endDate', new Date(newDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  }, [formData, updateFormData]);
  
  // Create trip
  const handleCreateTrip = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCreateTrip({
        title: formData.title.trim(),
        description: formData.description.trim() || 'An amazing adventure awaits!',
        image: formData.image!,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      
      onClose();
    } catch (error) {
      setErrors({ title: 'Failed to create trip. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onCreateTrip, onClose]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropAnim }
        ]}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose} />
      </Animated.View>
      
      {/* Modal */}
      <Animated.View
        style={[
          styles.modal,
          {
            backgroundColor: colors.surface.primary,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border.primary }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close modal"
            >
              <Icon name="x" size="lg" color={colors.text.secondary} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Create Trip
            </Text>
            
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: colors.primary[500] },
                isLoading && styles.createButtonDisabled
              ]}
              onPress={handleCreateTrip}
              disabled={isLoading}
              accessibilityLabel="Create trip"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cover Photo */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Cover Photo
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.imageContainer,
                  { backgroundColor: colors.surface.secondary },
                  errors.image && styles.imageContainerError
                ]}
                onPress={handleImagePicker}
                disabled={isImageLoading}
                accessibilityLabel="Select cover photo"
              >
                {formData.image ? (
                  <>
                    <Image
                      source={{ uri: formData.image }}
                      style={styles.coverImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.4)']}
                      style={styles.imageOverlay}
                    >
                      <View style={styles.imageOverlayContent}>
                        <Icon name="edit" size="sm" color="white" />
                        <Text style={styles.imageOverlayText}>Change Photo</Text>
                      </View>
                    </LinearGradient>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    {isImageLoading ? (
                      <ActivityIndicator size="large" color={colors.primary[500]} />
                    ) : (
                      <>
                        <View style={[styles.imageIcon, { backgroundColor: colors.primary[100] }]}>
                          <Icon name="image" size="xl" color={colors.primary[600]} />
                        </View>
                        <Text style={[styles.imagePlaceholderText, { color: colors.text.secondary }]}>
                          Choose cover photo
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
              
              {errors.image && (
                <Text style={[styles.errorText, { color: colors.error[500] }]}>
                  {errors.image}
                </Text>
              )}
            </View>
            
            {/* Trip Name */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Trip Name
              </Text>
              
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: colors.surface.secondary,
                    color: colors.text.primary,
                    borderColor: errors.title ? colors.error[500] : 'transparent',
                  }
                ]}
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="Enter your trip name..."
                placeholderTextColor={colors.text.tertiary}
                maxLength={50}
                accessibilityLabel="Trip name"
              />
              
                             {errors.title && (
                 <Text style={[styles.errorText, { color: colors.error[500] }]}>
                   {errors.title}
                 </Text>
               )}
            </View>
            
            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Description (Optional)
              </Text>
              
              <TextInput
                style={[
                  styles.textInput,
                  styles.textInputMultiline,
                  { 
                    backgroundColor: colors.surface.secondary,
                    color: colors.text.primary,
                    borderColor: 'transparent',
                  }
                ]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Tell us about your adventure..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={200}
                textAlignVertical="top"
                accessibilityLabel="Trip description"
              />
            </View>
            
            {/* Dates */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Trip Dates
              </Text>
              
              <View style={styles.datesContainer}>
                {/* Start Date */}
                <View style={styles.dateSection}>
                  <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>
                    From
                  </Text>
                  <View style={styles.dateControls}>
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                      onPress={() => handleDateSelect('startDate', -1)}
                      disabled={formData.startDate <= new Date()}
                    >
                      <Icon name="chevron-left" size="sm" color={colors.text.secondary} />
                    </TouchableOpacity>
                    
                    <View style={styles.dateDisplay}>
                      <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                        {formatDate(formData.startDate)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                      onPress={() => handleDateSelect('startDate', 1)}
                    >
                      <Icon name="chevron-right" size="sm" color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* End Date */}
                <View style={styles.dateSection}>
                  <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>
                    To
                  </Text>
                  <View style={styles.dateControls}>
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                      onPress={() => handleDateSelect('endDate', -1)}
                      disabled={formData.endDate <= formData.startDate}
                    >
                      <Icon name="chevron-left" size="sm" color={colors.text.secondary} />
                    </TouchableOpacity>
                    
                    <View style={styles.dateDisplay}>
                      <Text style={[styles.dateValue, { color: colors.text.primary }]}>
                        {formatDate(formData.endDate)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                      onPress={() => handleDateSelect('endDate', 1)}
                    >
                      <Icon name="chevron-right" size="sm" color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
                             {errors.dates && (
                 <Text style={[styles.errorText, { color: colors.error[500] }]}>
                   {errors.dates}
                 </Text>
               )}
            </View>
            
            {/* Bottom spacing for keyboard */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  
  backdropPressable: {
    flex: 1,
  },
  
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: screenHeight * 0.9,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  
  keyboardAvoidingView: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  
  closeButton: {
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  createButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  createButtonDisabled: {
    opacity: 0.7,
  },
  
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  
  section: {
    marginBottom: SPACING.xl,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  
  imageContainer: {
    height: 160,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  
  imageContainerError: {
    borderWidth: 1,
    borderColor: 'red',
  },
  
  coverImage: {
    width: '100%',
    height: '100%',
  },
  
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  imageOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  imageOverlayText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  
  imageIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  textInput: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
  },
  
  textInputMultiline: {
    height: 80,
    paddingTop: SPACING.md,
  },
  
  datesContainer: {
    gap: SPACING.lg,
  },
  
  dateSection: {
    gap: SPACING.sm,
  },
  
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  
  bottomSpacing: {
    height: 100,
  },
}); 