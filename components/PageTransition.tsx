import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = "" 
}) => {
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setIsPageLoading(true);
    };

    const handleRouteChangeComplete = () => {
      setIsPageLoading(false);
      setDisplayChildren(children);
    };

    const handleRouteChangeError = () => {
      setIsPageLoading(false);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router, children]);

  // Update children when they change (but not during route transitions)
  useEffect(() => {
    if (!isPageLoading) {
      setDisplayChildren(children);
    }
  }, [children, isPageLoading]);

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="relative">
          {/* Loading spinner with Clydra branding */}
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0BA5EC] rounded-full animate-spin"></div>
          
          {/* Pulsing background effect */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-[#0BA5EC]/20 rounded-full animate-ping"></div>
          
          {/* Loading text */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="text-sm text-gray-500 font-medium animate-pulse">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`page-container transition-all duration-500 ease-out ${className}`}
      style={{
        animation: 'pageEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      }}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
