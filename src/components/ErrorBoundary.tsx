/**
 * ErrorBoundary — catches unhandled JS errors in the component tree
 * and shows a recovery screen instead of a white screen crash.
 *
 * Uses a functional wrapper so the inner class component can access theme colors.
 */
import React, { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useColors, type ThemeColors } from '../contexts/ThemeContext';

interface Props {
  children: ReactNode;
  colors: ThemeColors;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const c = this.props.colors;
      return (
        <View style={[s.container, { backgroundColor: c.background }]}>
          <ScrollView contentContainerStyle={s.content}>
            <Text style={s.icon}>⚠️</Text>
            <Text style={[s.title, { color: c.text }]}>Something went wrong</Text>
            <Text style={[s.message, { color: c.textSecondary }]}>
              The app ran into an unexpected error. You can try again — your workout data is safely saved.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={[s.errorBox, { backgroundColor: c.dangerBg }]}>
                <Text style={[s.errorText, { color: c.danger }]}>{this.state.error.message}</Text>
              </View>
            )}
            <Pressable style={[s.retryBtn, { backgroundColor: c.primary }]} onPress={this.handleReset}>
              <Text style={[s.retryBtnText, { color: c.primaryText }]}>Try Again</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

/** Functional wrapper that provides theme colors to the class ErrorBoundary. */
export default function ErrorBoundary({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <ErrorBoundaryInner colors={colors}>{children}</ErrorBoundaryInner>;
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  retryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
