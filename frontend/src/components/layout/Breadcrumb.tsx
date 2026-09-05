import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatName = (str: string) => {
    return str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <nav className="flex items-center space-x-1 text-xs text-slate-500 mb-4 font-medium">
      <Link to="/dashboard" className="hover:text-primary-600 flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={name}>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            {isLast ? (
              <span className="text-slate-800 font-semibold">{formatName(name)}</span>
            ) : (
              <Link to={routeTo} className="hover:text-primary-600">
                {formatName(name)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
