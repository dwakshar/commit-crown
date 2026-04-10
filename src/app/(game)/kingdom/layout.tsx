import { OnboardingGuard } from "@/src/components/ui/OnboardingGuard";

export default function KingdomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGuard>{children}</OnboardingGuard>;
}
