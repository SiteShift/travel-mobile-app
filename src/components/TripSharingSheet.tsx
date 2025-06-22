import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BottomSheet, BottomSheetProps } from './BottomSheet';
import { Icon } from './Icon';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface ShareOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

export interface TripSharingSheetProps extends Omit<BottomSheetProps, 'children'> {
  tripTitle: string;
  tripId: string;
  tripUrl?: string;
  coverImageUrl?: string;
  onGenerateLink?: () => Promise<string>;
  onCustomShare?: (method: string, data: any) => void;
}

export const TripSharingSheet: React.FC<TripSharingSheetProps> = ({
  tripTitle,
  tripId,
  tripUrl,
  coverImageUrl,
  onGenerateLink,
  onCustomShare,
  ...bottomSheetProps
}) => {
  const { colors } = useTheme();
  const [shareUrl, setShareUrl] = useState<string>(tripUrl || '');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'unlisted' | 'private'>('public');

  const handleGenerateShareLink = async () => {
    if (shareUrl) return; // Already have a link
    
    setIsGeneratingLink(true);
    try {
      const link = onGenerateLink ? await onGenerateLink() : `https://traveljournal.app/trip/${tripId}`;
      setShareUrl(link);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate share link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      await handleGenerateShareLink();
      return;
    }

    try {
      await Clipboard.setString(shareUrl);
      Alert.alert('Link Copied', 'The trip link has been copied to your clipboard.');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link. Please try again.');
    }
  };

  const handleNativeShare = async () => {
    try {
      const shareContent = {
        title: `Check out my trip: ${tripTitle}`,
        message: shareUrl 
          ? `${tripTitle}\n\n${shareUrl}` 
          : `Check out my amazing trip: ${tripTitle}`,
        url: shareUrl,
      };

      await Share.share(shareContent);
      onCustomShare?.('native', shareContent);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'native',
      title: 'Share via Apps',
      subtitle: 'WhatsApp, Messages, Email, etc.',
      icon: 'share',
      onPress: handleNativeShare,
    },
    {
      id: 'copy',
      title: 'Copy Link',
      subtitle: 'Copy shareable link to clipboard',
      icon: 'copy',
      onPress: handleCopyLink,
    },
    {
      id: 'qr',
      title: 'QR Code',
      subtitle: 'Generate QR code for easy sharing',
      icon: 'qr-code',
      onPress: () => {
        Alert.alert('QR Code', 'QR code sharing coming soon!');
        onCustomShare?.('qr', { tripId, tripTitle });
      },
    },
    {
      id: 'embed',
      title: 'Embed Code',
      subtitle: 'Get HTML code for websites',
      icon: 'code',
      color: colors.info[500],
      onPress: () => {
        Alert.alert('Embed Code', 'Embed functionality coming soon!');
        onCustomShare?.('embed', { tripId, tripTitle });
      },
    },
    {
      id: 'pdf',
      title: 'Export as PDF',
      subtitle: 'Create a printable version',
      icon: 'document',
      color: colors.error[500],
      onPress: () => {
        Alert.alert('PDF Export', 'PDF export functionality coming soon!');
        onCustomShare?.('pdf', { tripId, tripTitle });
      },
    },
  ];

  const privacyOptions = [
    {
      id: 'public' as const,
      title: 'Public',
      subtitle: 'Anyone with the link can view',
      icon: 'globe',
    },
    {
      id: 'unlisted' as const,
      title: 'Unlisted',
      subtitle: 'Only people with the link can view',
      icon: 'link',
    },
    {
      id: 'private' as const,
      title: 'Private',
      subtitle: 'Only you can view',
      icon: 'lock',
    },
  ];

  const renderShareOption = (option: ShareOption) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.shareOption,
        {
          backgroundColor: colors.surface.primary,
          borderColor: colors.border.primary,
        },
      ]}
      onPress={option.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.shareOptionIcon, { backgroundColor: colors.surface.secondary }]}>
        <Icon
          name={option.icon}
          size="md"
          color={option.color || colors.text.primary}
        />
      </View>
      
      <View style={styles.shareOptionContent}>
        <Text style={[styles.shareOptionTitle, { color: colors.text.primary }]}>
          {option.title}
        </Text>
        {option.subtitle && (
          <Text style={[styles.shareOptionSubtitle, { color: colors.text.secondary }]}>
            {option.subtitle}
          </Text>
        )}
      </View>

      <Icon name="chevron-right" size="sm" color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  const renderPrivacyOption = (option: typeof privacyOptions[0]) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.privacyOption,
        {
          backgroundColor: privacyLevel === option.id ? colors.primary[100] : colors.surface.primary,
          borderColor: privacyLevel === option.id ? colors.primary[500] : colors.border.primary,
        },
      ]}
      onPress={() => setPrivacyLevel(option.id)}
      activeOpacity={0.7}
    >
      <Icon
        name={option.icon}
        size="sm"
        color={privacyLevel === option.id ? colors.primary[500] : colors.text.secondary}
      />
      <View style={styles.privacyOptionContent}>
        <Text
          style={[
            styles.privacyOptionTitle,
            {
              color: privacyLevel === option.id ? colors.primary[500] : colors.text.primary,
            },
          ]}
        >
          {option.title}
        </Text>
        <Text style={[styles.privacyOptionSubtitle, { color: colors.text.secondary }]}>
          {option.subtitle}
        </Text>
      </View>
      {privacyLevel === option.id && (
        <Icon name="checkmark" size="sm" color={colors.primary[500]} />
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Icon name="share" size="lg" color={colors.primary[500]} />
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
        Share Trip
      </Text>
      <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]} numberOfLines={1}>
        {tripTitle}
      </Text>
    </View>
  );

  const renderShareLink = () => (
    <View style={styles.linkSection}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Share Link
      </Text>
      
      <Input
        value={shareUrl}
        placeholder="Generate a shareable link..."
        editable={false}
        rightIcon={
          <Button
            title={isGeneratingLink ? 'Generating...' : shareUrl ? 'Copy' : 'Generate'}
            variant="ghost"
            size="small"
            onPress={shareUrl ? handleCopyLink : handleGenerateShareLink}
            loading={isGeneratingLink}
          />
        }
        containerStyle={styles.linkInput}
      />
    </View>
  );

  const renderPrivacySettings = () => (
    <View style={styles.privacySection}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Privacy Settings
      </Text>
      <View style={styles.privacyOptions}>
        {privacyOptions.map(renderPrivacyOption)}
      </View>
    </View>
  );

  const renderShareOptions = () => (
    <View style={styles.shareSection}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Share Options
      </Text>
      <View style={styles.shareOptions}>
        {shareOptions.map(renderShareOption)}
      </View>
    </View>
  );

  return (
    <BottomSheet {...bottomSheetProps} size="large">
      {renderHeader()}
      {renderShareLink()}
      {renderPrivacySettings()}
      {renderShareOptions()}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    ...TYPOGRAPHY.styles.h3,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.styles.body,
  },
  sectionTitle: {
    ...TYPOGRAPHY.styles.h4,
    marginBottom: SPACING.md,
  },
  linkSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  linkInput: {
    marginBottom: 0,
  },
  privacySection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  privacyOptions: {
    gap: SPACING.sm,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  privacyOptionContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  privacyOptionTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
  },
  privacyOptionSubtitle: {
    ...TYPOGRAPHY.styles.caption,
    marginTop: 2,
  },
  shareSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  shareOptions: {
    gap: SPACING.xs,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  shareOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  shareOptionContent: {
    flex: 1,
  },
  shareOptionTitle: {
    ...TYPOGRAPHY.styles.body,
    fontWeight: '600',
  },
  shareOptionSubtitle: {
    ...TYPOGRAPHY.styles.caption,
    marginTop: 2,
  },
}); 