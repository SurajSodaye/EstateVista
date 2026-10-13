import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from './Button';

export default function NotFoundState({
  title = 'Page Not Found',
  message = "The property, agent, or page you're searching for might have been moved or doesn't exist in our demonstration registry.",
  backLink = '/properties',
  backText = 'Explore Available Properties',
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <span className="font-serif text-8xl font-bold text-forest/20 tracking-tighter block mb-2">
          404
        </span>
        <h1 className="font-serif text-3xl font-bold text-charcoal mb-3">
          {title}
        </h1>
        <p className="text-mutedText text-sm leading-relaxed mb-8">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={backLink}>
            <Button variant="primary" icon={ArrowLeft} iconPosition="left">
              {backText}
            </Button>
          </Link>
          <Link to="/">
            <Button variant="secondary" icon={Home} iconPosition="left">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
