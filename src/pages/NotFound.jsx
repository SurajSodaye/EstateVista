import React from 'react';
import NotFoundState from '../components/common/NotFoundState';

export default function NotFound() {
  return (
    <NotFoundState
      title="Page Not Found"
      message="The page you requested does not exist or may have been moved. Discover our curated real estate catalog instead."
      backLink="/"
      backText="Explore Home"
    />
  );
}
