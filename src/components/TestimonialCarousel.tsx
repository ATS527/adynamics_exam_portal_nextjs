'use client'

import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, A11y } from 'swiper/modules';
import { Card, CardContent } from "@/components/ui/card";
import testimonialData from "@/constants/testimonialData";
import { Star } from "lucide-react";
import type { Swiper as SwiperType } from 'swiper';

import "swiper/css";

const TestimonialCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  };

  return (
    <div className="relative w-full">
      <div>
        <Swiper 
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          onSlideChange={handleSlideChange}
          modules={[Autoplay, A11y]}
          spaceBetween={30} 
          slidesPerView={1}
          // centeredSlides={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: true,
          }}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 15,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
          }}
        >
          {testimonialData.map((data, index) => (
            <SwiperSlide key={index}>
              <Card className="relative p-6 overflow-hidden">
                <div className={`absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 ${
                  index % 2 === 0 ? "border-primary" : "border-main"
                }`} />
                <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 ${
                  index % 2 === 0 ? "border-primary" : "border-main"
                }`} />

                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {data.rating.map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  <blockquote className="text-lg italic">
                    "{data.quote}"
                  </blockquote>

                  <div className="pt-4 border-t">
                    <p className="font-semibold">{data.author}</p>
                  </div>
                </CardContent>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="flex justify-center items-center gap-4 mt-8">
        <div className="flex gap-2">
          {testimonialData.map((_, index) => (
            <button
              key={index}
              onClick={() => swiperInstance?.slideTo(index)}
              className={`h-2 transition-all duration-300 rounded-full ${
                activeIndex === index 
                  ? "w-5 bg-main" 
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCarousel;