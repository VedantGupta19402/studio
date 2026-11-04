import Nav from "@/components/sections/Nav";
import HeroWorldClient from "@/components/sections/HeroWorldClient";
import Intro from "@/components/sections/Intro";
import Projects from "@/components/sections/Projects";
import StatusTable from "@/components/sections/StatusTable";
import Studio from "@/components/sections/Studio";
import Team from "@/components/sections/Team";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main id="main">
      <Nav />
      <HeroWorldClient />
      <Intro />
      <Projects />
      <StatusTable />
      <Studio />
      <Team />
      <Footer />
    </main>
  );
}
