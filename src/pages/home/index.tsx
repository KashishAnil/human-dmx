import Hero from "../../components/home/Hero";
import CategoryRail from "../../components/home/CategoryRail";
import FeaturedDrop from "../../components/home/FeaturedDrop";
import StorySplit from "../../components/home/StorySplit";
import Lookbook from "../../components/home/Lookbook";
import HouseRules from "../../components/home/HouseRules";
import { Marquee } from "../../components/ui/Bits";

const MARQUEE = [
  "Back To The Old School",
  "Kool & Deadly",
  "Doing The Human Box",
  "Brooklyn, New York",
  "Est. 1986",
  "Human DMX Apparel",
];

const Home = () => (
  <>
    <Hero />
    <CategoryRail />
    <FeaturedDrop />
    <Marquee items={MARQUEE} tone="blue" />
    <StorySplit />
    <Lookbook />
    <HouseRules />
  </>
);

export default Home;
