interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="transition-opacity duration-200 ease-out">
      {children}
    </div>
  );
} 