import { Navbar } from "@/components/navbar";
import { GlobalControl } from "@/components/global-control";
import { Footer } from "@/components/footer";
// import { MiniPlayer } from "@/features/media/components/mini-player";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <GlobalControl />
      <main className="flex w-full grow flex-col">{children}</main>
      <Footer />
      {/* TODO: Move MiniPlayer to a dedicated location later */}
      {/* <MiniPlayer /> */}
    </div>
  );
}
