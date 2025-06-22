import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { Badge } from './Badge';
import {
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
} from '../constants/theme';

export interface RichTextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  showToolbar?: boolean;
  showWordCount?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: ViewStyle;
  testID?: string;
}

interface FormatAction {
  id: string;
  title: string;
  icon: string;
  markdown: string;
  type: 'wrap' | 'prefix' | 'insert';
  shortcut?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChangeText,
  placeholder = 'What happened on this day?',
  maxLength = 10000,
  minHeight = 200,
  showToolbar = true,
  showWordCount = true,
  autoFocus = false,
  editable = true,
  onFocus,
  onBlur,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const textInputRef = useRef<TextInput>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const formatActions: FormatAction[] = [
    {
      id: 'bold',
      title: 'Bold',
      icon: 'text-bold',
      markdown: '**',
      type: 'wrap',
      shortcut: '⌘B',
    },
    {
      id: 'italic',
      title: 'Italic',
      icon: 'text-italic',
      markdown: '*',
      type: 'wrap',
      shortcut: '⌘I',
    },
    {
      id: 'heading',
      title: 'Heading',
      icon: 'text-header',
      markdown: '## ',
      type: 'prefix',
    },
    {
      id: 'list',
      title: 'List',
      icon: 'list',
      markdown: '- ',
      type: 'prefix',
    },
    {
      id: 'numbered',
      title: 'Numbered List',
      icon: 'list-numbered',
      markdown: '1. ',
      type: 'prefix',
    },
    {
      id: 'quote',
      title: 'Quote',
      icon: 'quote',
      markdown: '> ',
      type: 'prefix',
    },
    {
      id: 'code',
      title: 'Code',
      icon: 'code',
      markdown: '`',
      type: 'wrap',
    },
    {
      id: 'link',
      title: 'Link',
      icon: 'link',
      markdown: '[]()',
      type: 'insert',
    },
  ];

  const quickInserts = [
    { id: 'weather', text: '🌤️ Weather: ', icon: 'weather-sunny' },
    { id: 'food', text: '🍽️ Food: ', icon: 'food' },
    { id: 'transport', text: '🚗 Transport: ', icon: 'car' },
    { id: 'activity', text: '🎯 Activity: ', icon: 'target' },
    { id: 'mood', text: '😊 Mood: ', icon: 'happy' },
    { id: 'cost', text: '💰 Cost: ', icon: 'cash' },
  ];

  const getWordCount = () => {
    if (!value) return 0;
    return value.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    return value?.length || 0;
  };

  const handleSelectionChange = (event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setSelectionStart(start);
    setSelectionEnd(end);
  };

  const handleFormat = (action: FormatAction) => {
    if (!editable) return;

    const currentText = value || '';
    const start = selectionStart;
    const end = selectionEnd;
    const selectedText = currentText.substring(start, end);

    let newText = '';
    let newCursorPos = start;

    switch (action.type) {
      case 'wrap':
        const markdown = action.markdown;
        if (selectedText) {
          // Wrap selected text
          newText = 
            currentText.substring(0, start) +
            markdown + selectedText + markdown +
            currentText.substring(end);
          newCursorPos = end + markdown.length * 2;
        } else {
          // Insert markers and position cursor between them
          newText = 
            currentText.substring(0, start) +
            markdown + markdown +
            currentText.substring(start);
          newCursorPos = start + markdown.length;
        }
        break;

      case 'prefix':
        const lines = currentText.split('\n');
        const currentLineIndex = currentText.substring(0, start).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];
        
        // Check if line already has this prefix
        if (currentLine.startsWith(action.markdown)) {
          // Remove prefix
          lines[currentLineIndex] = currentLine.substring(action.markdown.length);
          newCursorPos = start - action.markdown.length;
        } else {
          // Add prefix
          lines[currentLineIndex] = action.markdown + currentLine;
          newCursorPos = start + action.markdown.length;
        }
        
        newText = lines.join('\n');
        break;

      case 'insert':
        newText = 
          currentText.substring(0, start) +
          action.markdown +
          currentText.substring(end);
        
        if (action.id === 'link') {
          // Position cursor between the brackets
          newCursorPos = start + 1;
        } else {
          newCursorPos = start + action.markdown.length;
        }
        break;
    }

    onChangeText(newText);

    // Focus and set cursor position after state update
    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.setNativeProps({
        selection: { start: newCursorPos, end: newCursorPos }
      });
    }, 10);
  };

  const handleQuickInsert = (text: string) => {
    if (!editable) return;

    const currentText = value || '';
    const start = selectionStart;
    
    const newText = 
      currentText.substring(0, start) +
      text +
      currentText.substring(start);
    
    onChangeText(newText);

    const newCursorPos = start + text.length;
    
    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.setNativeProps({
        selection: { start: newCursorPos, end: newCursorPos }
      });
    }, 10);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const renderToolbar = () => {
    if (!showToolbar) return null;

    return (
      <View style={[styles.toolbar, { borderBottomColor: colors.border.primary }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.toolbarScroll}
        >
          <View style={styles.toolbarSection}>
            {formatActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.toolbarButton,
                  { backgroundColor: colors.surface.secondary }
                ]}
                onPress={() => handleFormat(action)}
                disabled={!editable}
              >
                <Icon 
                  name={action.icon} 
                  size="sm" 
                  color={editable ? colors.text.primary : colors.text.disabled}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderQuickInserts = () => {
    if (!isFocused || !editable) return null;

    return (
      <View style={styles.quickInsertsContainer}>
        <Text style={[styles.quickInsertsTitle, { color: colors.text.secondary }]}>
          Quick inserts:
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickInsertsScroll}
        >
          <View style={styles.quickInserts}>
            {quickInserts.map((insert) => (
              <TouchableOpacity
                key={insert.id}
                style={[
                  styles.quickInsertButton,
                  { backgroundColor: colors.surface.secondary }
                ]}
                onPress={() => handleQuickInsert(insert.text)}
              >
                <Icon name={insert.icon} size="xs" color={colors.text.secondary} />
                <Text style={[styles.quickInsertText, { color: colors.text.secondary }]}>
                  {insert.text.split(': ')[0].replace(/[^\w\s]/gi, '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderFooter = () => {
    if (!showWordCount && !maxLength) return null;

    const wordCount = getWordCount();
    const charCount = getCharacterCount();
    const isNearLimit = charCount > maxLength * 0.8;

    return (
      <View style={[styles.footer, { borderTopColor: colors.border.primary }]}>
        <View style={styles.footerLeft}>
          {showWordCount && (
            <Text style={[styles.countText, { color: colors.text.tertiary }]}>
              {wordCount} words
            </Text>
          )}
        </View>
        
        <View style={styles.footerRight}>
          {maxLength && (
            <Text style={[
              styles.countText, 
              { 
                color: isNearLimit ? colors.warning[500] : colors.text.tertiary 
              }
            ]}>
              {charCount}/{maxLength}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {renderToolbar()}
      
      <TextInput
        ref={textInputRef}
        style={[
          styles.textInput,
          {
            color: colors.text.primary,
            backgroundColor: colors.surface.primary,
            minHeight,
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        multiline
        scrollEnabled
        maxLength={maxLength}
        autoFocus={autoFocus}
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
        textAlignVertical="top"
        keyboardType="default"
        returnKeyType="default"
        blurOnSubmit={false}
        testID={`${testID}-input`}
      />

      {renderQuickInserts()}
      {renderFooter()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  toolbar: {
    borderBottomWidth: 1,
    paddingVertical: SPACING.sm,
  },
  toolbarScroll: {
    flexGrow: 0,
  },
  toolbarSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    ...TYPOGRAPHY.styles.body,
    padding: SPACING.md,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  quickInsertsContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  quickInsertsTitle: {
    ...TYPOGRAPHY.styles.caption,
    marginBottom: SPACING.xs,
  },
  quickInsertsScroll: {
    flexGrow: 0,
  },
  quickInserts: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  quickInsertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  quickInsertText: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  countText: {
    ...TYPOGRAPHY.styles.caption,
    fontSize: 11,
  },
}); 