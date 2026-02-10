/**
 * ErrorBoundary — catches unhandled JS errors in the component tree
 * and shows a recovery screen instead of a white screen crash.
 */
import React, { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
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
      return (
        <View style={s.container}>
          <ScrollView contentContainerStyle={s.content}>
            <Text style={s.icon}>⚠️</Text>
            <Text style={s.title}>Something went wrong</Text>
            <Text style={s.message}>
              The app ran into an unexpected error. You can try again — your workout data is safely saved.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{this.state.error.message}</Text>
              </View>
            )}
            <Pressable style={s.retryBtn} onPress={this.handleReset}>
              <Text style={s.retryBtnText}>Try Again</Text>
            </Pressable>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4F1',
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
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    color: '#C00',
    fontFamily: 'monospace',
  },
  retryBtn: {
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
