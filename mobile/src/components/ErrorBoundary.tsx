import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

// Catches render crashes so the app shows a message instead of a blank black screen.
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error('Unhandled render error:', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-slate-100">
                    <div className="max-w-md rounded-2xl border border-red-400/30 bg-red-500/10 p-6">
                        <p className="font-display text-lg font-semibold">Algo salió mal.</p>
                        <p className="mt-2 text-sm text-slate-300">Intenta recargar la página. Si el problema continúa, avísale al equipo.</p>
                        <button
                            className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
                            onClick={() => window.location.reload()}
                            type="button"
                        >
                            Recargar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
