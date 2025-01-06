import LandinNav from "@/components/LandinNav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {

  return (
    <>
      <LandinNav/>
      <header className="w-full h-screen">
        {/* mobile hero */} 
        <div className="w-full h-screen flex items-center justify-center relative">
            <div className="z-10 px-3 flex flex-col items-center justify-center">
                <h1 className="text-white text-6xl font-extrabold tracking-tight text-center">
                    Master Your <br></br> Aviation Journey
                </h1>
                <p className="text-white text-xs font-normal text-center mt-3">
                    Unleash your potential and conquer aviation challenges with expert insights and practice tests to fuel your journey to the skies
                </p>
                <Link href={"/login"} className="mt-6">
                    <Button className="bg-main text-white hover:bg-mainDark">
                        Enroll Now
                    </Button>
                </Link>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-50 z-[2]"></div>
            <img src="/images/mob-hero-1.jpg" alt="hero" loading="lazy" className="absolute top-0 left-0 w-full h-full object-cover z-[1]"/>
        </div>
      </header>
    </>
  );
};

export default Home;
