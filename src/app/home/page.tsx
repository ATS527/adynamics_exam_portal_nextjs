import LandinNav from "@/components/LandinNav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartLine,
  Clock,
  Infinity as Unlimited,
  Trophy,
  CheckCircle,
  Star,
} from "lucide-react";
import whyChooseUs from "@/constants/whyChooseUsData";
import Image from "next/image";
import subjectData from "@/constants/subjectData";
import TestimonialCarousel from "@/components/TestimonialCarousel";


const Home = () => {
  const iconMap = {
    clock: Clock,
    "line-chart": ChartLine,
    trophy: Trophy,
    infinity: Unlimited,
  };

  return (
    <>
      <LandinNav />
      <header className="w-full">
        {/* mobile hero */}
        <div className="w-full h-screen flex items-center justify-center relative sm:hidden">
          <div className="z-10 px-3 flex flex-col items-center justify-center">
            <h1 className="text-white text-6xl font-extrabold tracking-tight text-center">
              Crack Your <br></br> Aviation Journey
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
                Crack Your <br></br> Aviation Journey
              </h1>
              <p className="text-white sm:w-[60%] lg:w-[40%] xl:w-[500px] text-sm font-normal text-center mt-3">
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

      <main className="w-full flex flex-col items-center justify-center mt-7">
        <section className="w-full lg:max-w-7xl">
          <div className="flex items-start justify-start w-full flex-col px-4 mt-12 md:mt-20">
            <h1 className="font-bold text-black text-3xl md:text-4xl">
              Why Choose us?
            </h1>
            <p className="text-sm md:text-base mt-3 md:mt-4">
              We are the most advanced and comprehensive test platform for DGCA,
              CPL and ATPL exams.
              <br />
              trusted by more than thousands of students and professionals
              around the world.
            </p>
          </div>

          <div className="px-4 grid grid-cols-2 lg:flex gap-3 mt-8">
            {whyChooseUs.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <Card key={item.title} className="w-full lg:w-3/12">
                  <CardHeader>
                    <Icon className="mb-2" />
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="w-full lg:max-w-7xl mt-28">
          <div className="flex flex-col lg:flex-row items-center justify-center px-4 lg:gap-10">
            <div className="relative w-7/12 h-40 lg:h-64 lg:w-1/2">
              <Image
                src={"/images/svgs/unlimited-try.svg"}
                alt="unlimited try"
                fill
                className="w-full h-full"
              />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center lg:items-start mt-3">
              <h1 className="text-center lg:text-start font-bold text-2xl lg:text-5xl leading-tight">
                Customize Your <br /> Perfect Schedule
              </h1>
              <p className="text-center lg:text-start font-normal text-sm lg:text-base text-gray-500 w-5/6 pt-2 sm:w-4/6">
                Enroll in unlimited mock tests and sharpen your skills. Take
                tests anytime, track progress, and improve with ease.
              </p>
            </div>
          </div>

          <div className="lg:mt-16 flex flex-col lg:flex-row-reverse items-center justify-center px-4 lg:gap-10">
            <div className="relative w-7/12 h-40 lg:h-64 lg:w-1/2">
              <Image
                src={"/images/svgs/learn-anywhere.svg"}
                alt="unlimited try"
                fill
                className="w-full h-full"
              />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center lg:items-end mt-3">
              <h1 className="text-center lg:text-end font-bold text-2xl lg:text-5xl leading-tight">
                Learn Anytime
                <br /> Anywhere
              </h1>
              <p className="text-center lg:text-end font-normal text-sm lg:text-base text-gray-500 w-5/6 pt-2 sm:w-4/6">
                Take practice tests seamlessly on your mobile, PC, or
                tablet—anytime, anywhere.
              </p>
            </div>
          </div>

          <div className="lg:mt-16 flex flex-col lg:flex-row items-center justify-center px-4 lg:gap-10">
            <div className="relative w-7/12 h-40 lg:h-64 lg:w-1/2">
              <Image
                src={"/images/svgs/flight-detail.svg"}
                alt="unlimited try"
                fill
                className="w-full h-full"
              />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center lg:items-start mt-3">
              <h1 className="text-center lg:text-start font-bold text-2xl lg:text-5xl leading-tight">
                Experience the real
                <br /> DGCA exam patterns.
              </h1>
              <p className="text-center lg:text-start font-normal text-sm lg:text-base text-gray-500 w-5/6 pt-2 sm:w-4/6">
                Complete mock tests designed to match the exam pattern, helping
                you track your progress and stay focused.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full lg:max-w-7xl mt-28">
          <div className="w-full flex flex-col items-start justify-start px-4">
            <h1 className="font-bold text-black text-3xl md:text-4xl">
              Choose <br /> Your Subject
            </h1>
            <p className="text-sm md:text-base mt-3 md:mt-4">
              Whether you're just starting out with your CPL exams or advancing
              your career with ATPL preparation, we’re here to support you at
              every stage of your journey.
            </p>
            <div className="w-full pt-10 flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subjectData.map((subject, index) => (
                <Card key={index} className="w-full flex flex-col">
                  <div className="h-48 w-full">
                    <img
                      src={subject.cover}
                      alt="Course Cover"
                      className="w-full h-full object-cover rounded-t-lg"
                      loading="lazy"
                    />
                  </div>

                  <CardHeader>
                    <CardTitle>{subject.title}</CardTitle>
                  </CardHeader>

                  <CardContent className=" flex-1 flex flex-col">
                    {/* <CardDescription>
                            Air Meteorology deals with weather patterns and atmospheric conditions affecting aviation. It ensures pilots can safely navigate winds, turbulence, and visibility challenges.
                          </CardDescription> */}

                    <ul className="space-y-2 mb-4">
                      {subject.topics.map((topic, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-main" />
                          <span className="text-sm text-gray-500">{topic}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between pt-4 border-t mt-1 sm:mt-auto">
                      <p className="text-2xl font-bold">
                        {subject.price.after}{" "}
                        <s className="text-base text-gray-400 ml-1">
                          {subject.price.before}
                        </s>
                      </p>
                      <Link href={subject.subjectLink}>
                        <Button>Enroll Now</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full lg:max-w-7xl mt-28">
          <div className="w-full flex flex-col items-start justify-start px-4">
            <h1 className="font-bold text-black text-3xl md:text-4xl">
              Testimonials
            </h1>
            <p className="text-sm md:text-base mt-3 md:mt-4">
              Over 200 students have successfully cleared their CPL and ATPL
              exams, thanks to the ADynamics test series. Here are a few
              inspiring success stories.
            </p>

            <div className="mt-12 w-full flex items-center justify-center">

              {/* <Card className="relative p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-main" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-main" />

                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  <blockquote className="text-lg italic">
                    "This course transformed my understanding completely. The
                    concepts were explained clearly and the practical exercises
                    were invaluable."
                  </blockquote>

                  <div className="pt-4 border-t">
                    <p className="font-semibold">Sarah Johnson</p>
                  </div>
                </CardContent>
              </Card> */}


              <TestimonialCarousel/>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
