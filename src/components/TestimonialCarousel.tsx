"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";

import "swiper/css";
import { Star } from "lucide-react";

const TestimonialCarousel = () => {
  return (
    <>
    <div className="w-full h-96">
      <Swiper
        spaceBetween={30}
        slidesPerView={1}
      >
        <SwiperSlide>
        <Card className="relative p-6 overflow-hidden">
                {/* Decorative corner lines */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-main" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-main" />

                <CardContent className="space-y-4">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg italic">
                    "This course transformed my understanding completely. The
                    concepts were explained clearly and the practical exercises
                    were invaluable."
                  </blockquote>

                  {/* Author */}
                  <div className="pt-4 border-t">
                    <p className="font-semibold">Sarah Johnson</p>
                  </div>
                </CardContent>
              </Card>
        </SwiperSlide>

        <SwiperSlide>
        <Card className="relative p-6 overflow-hidden">
                {/* Decorative corner lines */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary" />

                <CardContent className="space-y-4">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg italic">
                    "This course transformed my understanding completely. The
                    concepts were explained clearly and the practical exercises
                    were invaluable."
                  </blockquote>

                  {/* Author */}
                  <div className="pt-4 border-t">
                    <p className="font-semibold">Sarah Johnson</p>
                  </div>
                </CardContent>
              </Card>
        </SwiperSlide>


        <SwiperSlide>
        <Card className="relative p-6 overflow-hidden">
                {/* Decorative corner lines */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-main" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-main" />

                <CardContent className="space-y-4">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg italic">
                    "This course transformed my understanding completely. The
                    concepts were explained clearly and the practical exercises
                    were invaluable."
                  </blockquote>

                  {/* Author */}
                  <div className="pt-4 border-t">
                    <p className="font-semibold">Sarah Johnson</p>
                  </div>
                </CardContent>
              </Card>
        </SwiperSlide>

      </Swiper>
    </div>
    </>
  );
};

export default TestimonialCarousel;
