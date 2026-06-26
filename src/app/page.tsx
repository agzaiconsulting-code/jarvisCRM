import NetworkCanvas from "@/components/ui/NetworkCanvas";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Process from "@/components/sections/Process";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <NetworkCanvas density={64} />
      <Nav />
      <main id="main-content">
        <Hero />
        <Services />
        <Process />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
