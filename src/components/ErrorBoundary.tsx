import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button } from './Button';
import { Icon } from './Icon';
import { SafeAreaWrapper } from './SafeAreaWrapper';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  enableReporting?: boolean;
  level?: 'screen' | 'component' | 'critical';
  context?: string;
  testID?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
    
    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
    });

    // Report error to external service
    this.reportError(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    if (!this.props.enableReporting) return;

    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
      userAgent: 'React Native', // Would be more specific in real app
    };

    // In a real app, send to error reporting service (Sentry, Bugsnag, etc.)
    console.log('Error Report:', errorReport);
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    } else {
      Alert.alert(
        'Maximum Retries Reached',
        'Please restart the app if the problem persists.',
        [{ text: 'OK' }]
      );
    }
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    
    // In a real app, this would open a bug report form or email
    Alert.alert(
      'Report Bug',
      'Would you like to report this issue to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // Send detailed error report
            this.reportError(error!, errorInfo!);
            Alert.alert('Thank you', 'Your report has been sent.');
          },
        },
      ]
    );
  };

  private renderErrorDetails = () => {
    const { error, errorInfo } = this.state;
    
    if (!__DEV__ || !error) return null;

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Information</Text>
        <ScrollView style={styles.debugScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Error: </Text>
            {error.message}
          </Text>
          {error.stack && (
            <Text style={styles.debugText}>
              <Text style={styles.debugLabel}>Stack: </Text>
              {error.stack}
            </Text>
          )}
          {errorInfo?.componentStack && (
            <Text style={styles.debugText}>
              <Text style={styles.debugLabel}>Component Stack: </Text>
              {errorInfo.componentStack}
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  private renderFallbackUI = () => {
    const { level, context } = this.props;
    const { retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;

    // Critical errors need more prominent handling
    if (level === 'critical') {
      return (
        <SafeAreaWrapper variant="full">
          <View style={styles.criticalErrorContainer}>
            <View style={styles.criticalErrorContent}>
                             <Icon
                 name="alert-triangle"
                 size="xxl"
                 color="#ef4444"
                 style={styles.criticalErrorIcon}
               />
              <Text style={styles.criticalErrorTitle}>
                Critical Error
              </Text>
              <Text style={styles.criticalErrorMessage}>
                The app has encountered a critical error and needs to restart.
              </Text>
              <Button
                title="Restart App"
                onPress={() => {
                  // In a real app, this would restart the app
                  this.handleRetry();
                }}
                variant="primary"
                size="large"
                style={styles.criticalErrorButton}
                testID={`${this.props.testID}-restart`}
              />
            </View>
          </View>
        </SafeAreaWrapper>
      );
    }

    // Screen-level errors
    if (level === 'screen') {
      return (
        <SafeAreaWrapper variant="full">
          <View style={styles.screenErrorContainer}>
            <View style={styles.errorContent}>
              <Icon
                name="frown"
                size="xxl"
                color="#6b7280"
                style={styles.errorIcon}
              />
              <Text style={styles.errorTitle}>
                Oops! Something went wrong
              </Text>
              <Text style={styles.errorMessage}>
                {context ? `Error in ${context}` : 'We encountered an unexpected error on this screen.'}
              </Text>
              
              <View style={styles.buttonContainer}>
                {canRetry && (
                  <Button
                    title={`Try Again${retryCount > 0 ? ` (${retryCount}/${this.maxRetries})` : ''}`}
                    onPress={this.handleRetry}
                    variant="primary"
                    size="medium"
                    style={styles.retryButton}
                    testID={`${this.props.testID}-retry`}
                  />
                )}
                <Button
                  title="Report Issue"
                  onPress={this.handleReportBug}
                  variant="secondary"
                  size="medium"
                  style={styles.reportButton}
                  testID={`${this.props.testID}-report`}
                />
              </View>
            </View>
            
            {this.renderErrorDetails()}
          </View>
        </SafeAreaWrapper>
      );
    }

    // Component-level errors (smaller, inline)
    return (
      <View style={styles.componentErrorContainer}>
        <Icon
          name="alert-circle"
          size="lg"
          color="#ef4444"
          style={styles.componentErrorIcon}
        />
        <View style={styles.componentErrorContent}>
          <Text style={styles.componentErrorText}>
            {context ? `${context} failed to load` : 'Component error'}
          </Text>
          {canRetry && (
            <Button
              title="Retry"
              onPress={this.handleRetry}
              variant="ghost"
              size="small"
              testID={`${this.props.testID}-retry`}
            />
          )}
        </View>
      </View>
    );
  };

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback component takes precedence
      if (fallback) {
        return fallback;
      }
      
      // Default fallback UI based on error level
      return this.renderFallbackUI();
    }

    return children;
  }
}

const styles = StyleSheet.create({
  // Critical error styles
  criticalErrorContainer: {
    flex: 1,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  criticalErrorContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  criticalErrorIcon: {
    marginBottom: SPACING.xl,
  },
  criticalErrorTitle: {
    ...TYPOGRAPHY.styles.h2,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  criticalErrorMessage: {
    ...TYPOGRAPHY.styles.body,
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  criticalErrorButton: {
    minWidth: 200,
  },

  // Screen error styles
  screenErrorContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorContent: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  errorIcon: {
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    ...TYPOGRAPHY.styles.h3,
    color: '#111827',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    ...TYPOGRAPHY.styles.body,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
  retryButton: {
    marginBottom: SPACING.md,
  },
  reportButton: {
    marginBottom: SPACING.md,
  },

  // Component error styles
  componentErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#fef2f2',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    margin: SPACING.sm,
  },
  componentErrorIcon: {
    marginRight: SPACING.sm,
  },
  componentErrorContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  componentErrorText: {
    ...TYPOGRAPHY.styles.bodySmall,
    color: '#dc2626',
    flex: 1,
  },

  // Debug styles
  debugContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  debugTitle: {
    ...TYPOGRAPHY.styles.h4,
    color: '#374151',
    marginBottom: SPACING.sm,
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    ...TYPOGRAPHY.styles.caption,
    color: '#6b7280',
    fontFamily: 'Courier',
    marginBottom: SPACING.xs,
  },
  debugLabel: {
    fontWeight: '600',
    color: '#374151',
  },
});

// Higher-order component for easier usage
export const withErrorBoundary = <P extends {}>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WithErrorBoundaryComponent;
};

// Hook for error reporting in functional components
export const useErrorHandler = () => {
  const reportError = (error: Error, context?: string) => {
    if (__DEV__) {
      console.error(`Error in ${context}:`, error);
    }
    
    // In a real app, send to error reporting service
    // errorReportingService.reportError(error, { context });
  };

  return { reportError };
}; 