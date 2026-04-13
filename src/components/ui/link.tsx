import React from 'react';
import { Link as ReactRouterLink, LinkProps } from 'react-router';

/**
 * @deprecated Use `Link` from `react-router` directly instead.
 *
 * This component is kept for backward compatibility with existing apps.
 * New code should import Link directly from react-router:
 *
 * @example
 * ```tsx
 * // Preferred approach - use react-router directly
 * import { Link } from 'react-router';
 *
 * function Navigation() {
 *   const dashboardUrl = getPageUrl(dashboardPageConfig);
 *   return (
 *     <nav>
 *       <Link to={dashboardUrl}>Dashboard</Link>
 *     </nav>
 *   );
 * }
 * ```
 */
export const Link = ({ href, to, ...props }: LinkProps & { href?: string }) => {
  return <ReactRouterLink {...props} to={to || href || ''} />;
};
