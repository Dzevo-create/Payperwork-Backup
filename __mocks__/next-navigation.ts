/**
 * Mock for next/navigation
 */

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  pathname: "/",
  query: {},
  asPath: "/",
  route: "/",
  basePath: "",
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
}));

export const usePathname = jest.fn(() => "/");
export const useSearchParams = jest.fn(() => new URLSearchParams());
export const useParams = jest.fn(() => ({}));
export const redirect = jest.fn();
export const permanentRedirect = jest.fn();
export const notFound = jest.fn();
