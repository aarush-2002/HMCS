import { Link } from 'react-router-dom';
import { Home, AlertTriangle, Lock, Server } from 'lucide-react';

interface ErrorPageProps {
  code: '403' | '404' | '500';
}

export function ErrorPage({ code }: ErrorPageProps) {
  const configs = {
    '403': {
      icon: Lock,
      title: 'Access Denied',
      message: 'You don\'t have permission to view this page.',
      color: 'text-ember',
      bgColor: 'bg-ember/20',
    },
    '404': {
      icon: AlertTriangle,
      title: 'This window is dark.',
      message: 'The page you\'re looking for doesn\'t exist or has been moved.',
      color: 'text-bone-dim',
      bgColor: 'bg-line/30',
    },
    '500': {
      icon: Server,
      title: 'Something went wrong',
      message: 'We\'re experiencing technical difficulties. Please try again later.',
      color: 'text-emergency',
      bgColor: 'bg-emergency/20',
    },
  };

  const config = configs[code];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error code */}
        <div className={`text-8xl font-light ${config.color} mb-4 tabular`}>
          {code}
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-medium text-bone mb-3">
          {config.title}
        </h1>

        {/* Message */}
        <p className="text-bone-dim mb-8">
          {config.message}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ember text-ink rounded-lg font-medium hover:bg-ember/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 bg-ink border border-line rounded-lg text-bone-dim hover:text-bone hover:border-bone-dim transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
