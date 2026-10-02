import { RouteResolve } from "@/components/visual/route-resolve";

export default function Template({ children }: { children: React.ReactNode }) {
  return <RouteResolve>{children}</RouteResolve>;
}
