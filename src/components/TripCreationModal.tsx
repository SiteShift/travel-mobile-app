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
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BUTTON_HEIGHT = 54;

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateField, setSelectedDateField] = useState<'startDate' | 'endDate' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  
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
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  // Update form data
  const updateFormData = useCallback((field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors[field as keyof TripFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: TripFormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Trip name is required';
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
  
  // Permission handling
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add cover photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };



  const addCoverPhotoFromSource = useCallback(async (source: 'camera' | 'library') => {
    try {
      setIsImageLoading(true);
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const originalUri = result.assets[0].uri;
        updateFormData('image', originalUri);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, image: 'Failed to add cover photo. Please try again.' }));
    } finally {
      setIsImageLoading(false);
    }
  }, [updateFormData]);

  // Cover photo selection with action sheet
  const handleAddCoverPhoto = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Cover Photo',
      'Choose how you want to add your cover photo',
      [
        {
          text: 'Take Photo',
          onPress: () => addCoverPhotoFromSource('camera'),
        },
        {
          text: 'Choose from Library',
          onPress: () => addCoverPhotoFromSource('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, [addCoverPhotoFromSource]);
  
  // Handle date selection
  const handleDateSelect = useCallback((field: 'startDate' | 'endDate', increment: number) => {
    const currentDate = formData[field];
    const newDate = new Date(currentDate.getTime() + increment * 24 * 60 * 60 * 1000);
    
    updateFormData(field, newDate);
    
    // Auto-adjust end date if needed
    if (field === 'startDate' && newDate >= formData.endDate) {
      updateFormData('endDate', new Date(newDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  }, [formData, updateFormData]);

  // Handle opening date picker
  const openDatePicker = useCallback((field: 'startDate' | 'endDate') => {
    setSelectedDateField(field);
    // Set calendar to show the month of the selected date
    const currentDate = formData[field];
    setCalendarMonth(currentDate.getMonth());
    setCalendarYear(currentDate.getFullYear());
    setShowDatePicker(true);
  }, [formData]);

  // Handle date selection from calendar
  const handleCalendarDateSelect = useCallback((date: Date) => {
    if (!selectedDateField) return;
    
    updateFormData(selectedDateField, date);
    
    // Auto-adjust end date if needed
    if (selectedDateField === 'startDate' && date >= formData.endDate) {
      updateFormData('endDate', new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
    
    setShowDatePicker(false);
    setSelectedDateField(null);
  }, [selectedDateField, formData.endDate, updateFormData]);

  // Navigate calendar months
  const navigateMonth = useCallback((direction: 1 | -1) => {
    const newDate = new Date(calendarYear, calendarMonth + direction, 1);
    setCalendarMonth(newDate.getMonth());
    setCalendarYear(newDate.getFullYear());
  }, [calendarMonth, calendarYear]);

  // Handle year selection
  const selectYear = useCallback((year: number) => {
    setCalendarYear(year);
    setShowYearPicker(false);
  }, []);

  // Generate year options (current year ± 10 years)
  const generateYearOptions = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Generate calendar days for a given month
  const generateCalendarDays = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days = [];
    const current = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, []);

  // Generate calendar days using state-controlled month/year
  const calendarDays = generateCalendarDays(calendarYear, calendarMonth);
  
  // Create trip
  const handleCreateTrip = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tripDataToSend = {
        title: formData.title.trim(),
        description: formData.description.trim() || 'An amazing adventure awaits!',
        image: formData.image!,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      
      onCreateTrip(tripDataToSend);
      
      onClose();
      console.log('✅ Trip created:', tripDataToSend.title);
    } catch (error) {
      console.error('❌ TripCreationModal: Error in handleCreateTrip:', error);
      setErrors({ title: 'Failed to create trip. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, onCreateTrip, onClose, validateForm]);
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.background.primary,
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border.primary }]}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                Create Scrapbook
              </Text>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close modal"
              >
                <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>✕</Text>
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
                  *Cover Photo
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.imageContainer,
                    { 
                      backgroundColor: colors.surface.secondary,
                      borderColor: errors.image ? colors.error[500] : colors.border.secondary,
                      borderWidth: 1,
                    },
                    errors.image && styles.imageContainerError
                  ]}
                  onPress={handleAddCoverPhoto}
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
                            <Icon name="photo" size="xl" color={colors.primary[600]} />
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
                  *Trip Name
                </Text>
                
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      backgroundColor: colors.surface.secondary,
                      color: colors.text.primary,
                      borderColor: errors.title ? colors.error[500] : colors.border.secondary,
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
                  Description (optional)
                </Text>
                
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textInputMultiline,
                    { 
                      backgroundColor: colors.surface.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.secondary,
                    }
                  ]}
                  value={formData.description}
                  onChangeText={(value) => updateFormData('description', value)}
                  placeholder="Tell us about your adventure..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  accessibilityLabel="Trip description"
                />
              </View>
              
              {/* Trip Dates */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  *Trip Dates
                </Text>
                
                <View style={styles.dateContainer}>
                  {/* From Date */}
                  <View style={styles.dateSection}>
                    <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>
                      From
                    </Text>
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                        onPress={() => handleDateSelect('startDate', -1)}
                      >
                        <Icon name="left" size="sm" color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.dateDisplay, { 
                          backgroundColor: colors.surface.secondary,
                          borderColor: colors.border.secondary,
                          borderWidth: 1,
                        }]}
                        onPress={() => openDatePicker('startDate')}
                        accessibilityLabel="Select start date"
                      >
                        <View style={styles.dateDisplayContent}>
                          <Text style={[styles.dateText, { color: colors.text.primary }]}>
                            {formatDate(formData.startDate)}
                          </Text>
                          <Icon name="calendar" size="sm" color={colors.text.secondary} />
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                        onPress={() => handleDateSelect('startDate', 1)}
                      >
                        <Icon name="right" size="sm" color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* To Date */}
                  <View style={styles.dateSection}>
                    <Text style={[styles.dateLabel, { color: colors.text.secondary }]}>
                      To
                    </Text>
                    <View style={styles.dateRow}>
                      <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                        onPress={() => handleDateSelect('endDate', -1)}
                        disabled={new Date(formData.endDate.getTime() - 24 * 60 * 60 * 1000) <= formData.startDate}
                      >
                        <Icon name="left" size="sm" color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.dateDisplay, { 
                          backgroundColor: colors.surface.secondary,
                          borderColor: colors.border.secondary,
                          borderWidth: 1,
                        }]}
                        onPress={() => openDatePicker('endDate')}
                        accessibilityLabel="Select end date"
                      >
                        <View style={styles.dateDisplayContent}>
                          <Text style={[styles.dateText, { color: colors.text.primary }]}>
                            {formatDate(formData.endDate)}
                          </Text>
                          <Icon name="calendar" size="sm" color={colors.text.secondary} />
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.surface.secondary }]}
                        onPress={() => handleDateSelect('endDate', 1)}
                      >
                        <Icon name="right" size="sm" color={colors.text.secondary} />
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
              
              {/* Bottom spacing */}
              <View style={styles.bottomSpacing} />
            </ScrollView>
            
            {/* Bottom Create Button */}
            <View style={[styles.bottomButtonContainer, { backgroundColor: colors.background.primary }]}>
              <TouchableOpacity
                style={[
                  styles.bottomCreateButton,
                  { backgroundColor: colors.primary[500] },
                  (!formData.title.trim() || !formData.image || isLoading) && styles.bottomCreateButtonDisabled
                ]}
                onPress={handleCreateTrip}
                disabled={!formData.title.trim() || !formData.image || isLoading}
                accessibilityLabel="Create scrapbook"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.bottomCreateButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>

      {/* Calendar Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.calendarBackdrop}>
            <View style={[styles.calendarContainer, { backgroundColor: colors.background.primary }]}>
              <View style={[styles.calendarHeader, { borderBottomColor: colors.border.primary }]}>
                <TouchableOpacity
                  style={styles.calendarCloseButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>✕</Text>
                </TouchableOpacity>
                
                <Text style={[styles.calendarTitle, { color: colors.text.primary }]}>
                  Select {selectedDateField === 'startDate' ? 'Start' : 'End'} Date
                </Text>
                
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.calendarContent}>
                {showYearPicker && (
                  <TouchableOpacity
                    style={styles.yearPickerOverlay}
                    activeOpacity={1}
                    onPress={() => setShowYearPicker(false)}
                  />
                )}
                
                <View style={styles.monthNavigation}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => {
                      navigateMonth(-1);
                      setShowYearPicker(false);
                    }}
                  >
                    <Icon name="left" size="sm" color={colors.text.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.monthYearContainer}>
                    <TouchableOpacity
                      style={styles.monthYearTouchable}
                      onPress={() => setShowYearPicker(!showYearPicker)}
                    >
                      <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
                        {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long' })} {calendarYear}
                      </Text>
                      <Icon name="down" size="sm" color={colors.text.secondary} />
                    </TouchableOpacity>
                    
                    {showYearPicker && (
                      <View style={[styles.yearDropdown, { backgroundColor: colors.surface.secondary }]}>
                        <ScrollView style={styles.yearList} showsVerticalScrollIndicator={false}>
                          {generateYearOptions().map((year) => (
                            <TouchableOpacity
                              key={year}
                              style={[
                                styles.yearOption,
                                year === calendarYear && [styles.selectedYearOption, { backgroundColor: colors.primary[100] }]
                              ]}
                              onPress={() => selectYear(year)}
                            >
                              <Text style={[
                                styles.yearOptionText,
                                { color: year === calendarYear ? colors.primary[600] : colors.text.primary }
                              ]}>
                                {year}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => {
                      navigateMonth(1);
                      setShowYearPicker(false);
                    }}
                  >
                    <Icon name="right" size="sm" color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Text key={day} style={[styles.weekDay, { color: colors.text.secondary }]}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === calendarMonth;
                    const isSelected = selectedDateField && 
                      formData[selectedDateField] && 
                      day.toDateString() === formData[selectedDateField].toDateString();
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          isSelected && [styles.selectedDay, { backgroundColor: colors.primary[500] }],
                          isToday && !isSelected && [styles.todayDay, { borderColor: colors.primary[500] }],
                        ]}
                        onPress={() => {
                          setShowYearPicker(false);
                          handleCalendarDateSelect(day);
                        }}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            { color: isCurrentMonth ? colors.text.primary : colors.text.tertiary },
                            isSelected && styles.selectedDayText,
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    height: screenHeight * 0.92,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: 'Merienda',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
    borderRadius: 8,
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.lg,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  bottomButtonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  bottomCreateButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 100,
    minWidth: 140,
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomCreateButtonDisabled: {
    opacity: 0.6,
  },
  bottomCreateButtonText: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: 'Merienda',
    marginBottom: SPACING.md,
  },
  imageContainer: {
    height: 160,
    borderRadius: 12,
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
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
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
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    fontFamily: 'Inter',
    borderWidth: 1,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateContainer: {
    gap: SPACING.lg,
  },
  dateSection: {
    gap: SPACING.sm,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplay: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateText: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter',
    marginTop: SPACING.xs,
  },
  bottomSpacing: {
    height: SPACING.xxl,
  },
  // Calendar styles
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  calendarCloseButton: {
    padding: SPACING.xs,
    borderRadius: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: 'Merienda',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  calendarContent: {
    padding: SPACING.lg,
  },
  yearPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  navButton: {
    padding: SPACING.sm,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  monthYearTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: 'Merienda',
    textAlign: 'center',
  },
  yearDropdown: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: -80 }],
    width: 160,
    maxHeight: 200,
    borderRadius: 8,
    marginTop: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  yearList: {
    maxHeight: 200,
  },
  yearOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  selectedYearOption: {
    borderRadius: 6,
    marginHorizontal: SPACING.xs,
  },
  yearOptionText: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.sm,
  },
  weekDay: {
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
    textAlign: 'center',
    width: 40,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 2,
  },
  selectedDay: {
    borderRadius: 8,
  },
  todayDay: {
    borderWidth: 1,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: FONT_WEIGHTS.semibold,
  },
}); 