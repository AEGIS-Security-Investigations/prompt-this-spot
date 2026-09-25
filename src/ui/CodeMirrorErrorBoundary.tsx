"use client";

import { Component, type ReactNode } from "react";

type CodeMirrorErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type CodeMirrorErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Catches a CodeMirror runtime failure and renders `fallback` instead of
 * bubbling to the route error page.
 */
export class CodeMirrorErrorBoundary extends Component<
  CodeMirrorErrorBoundaryProps,
  CodeMirrorErrorBoundaryState
> {
  override state: CodeMirrorErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): CodeMirrorErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
