import LandinNav from "@/components/LandinNav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <>
      <LandinNav />
      <header className="w-full h-screen">
        {/* mobile hero */}
        <div className="w-full h-screen flex items-center justify-center relative sm:hidden">
          <div className="z-10 px-3 flex flex-col items-center justify-center">
            <h1 className="text-white text-6xl font-extrabold tracking-tight text-center">
              Master Your <br></br> Aviation Journey
            </h1>
            <p className="text-white text-xs font-normal text-center mt-3">
              Unleash your full potential and soar through your aviation
              challenges with a platform designed for success. From practice
              tests to expert insights, we’re here to fuel your journey to the
              skies.
            </p>
            <Link href={"/login"} className="mt-6">
              <Button className="bg-main text-white hover:bg-mainDark">
                Enroll Now
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-50 z-[2]"></div>
          <img
            src="/images/mob-hero-1.jpg"
            alt="hero"
            loading="lazy"
            className="absolute top-0 left-0 w-full h-full object-cover z-[1]"
          />
        </div>

        {/* desktop hero */}
        <div className="hidden sm:flex w-full h-screen xl:h-[690px] items-center justify-center">
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="z-10 px-3 flex flex-col items-center justify-center w-full">
              <h1 className="text-white text-7xl font-extrabold tracking-tight text-center">
                Master Your <br></br> Aviation Journey
              </h1>
              <p className="text-white sm:w-[60%] lg:w-[40%] text-sm font-normal text-center mt-3">
                Unleash your full potential and soar through your aviation
                challenges with a platform designed for success. From practice
                tests to expert insights, we’re here to fuel your journey to the
                skies.
              </p>
              <Link href={"/login"} className="mt-6">
                <Button className="bg-main text-white hover:bg-mainDark">
                  Enroll Now
                </Button>
              </Link>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black  z-[2]"></div>
            <img
              src="/images/desk-hero-1.jpg"
              alt="hero"
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full object-cover z-[1]"
            />
          </div>
        </div>
      </header>

      <main className="w-full h-[200vh]"></main>
    </>
  );
};

export default Home;
