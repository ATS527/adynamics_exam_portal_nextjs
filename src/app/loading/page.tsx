import LottieLoader from "@/components/LottieLoader";
import React from "react";

const Loader = () => {
  return (
    <>
      <main className="w-full h-screen flex flex-col items-center justify-center">
        <div className="w-40 sm:w-52 h-40 sm:h-52">
          <LottieLoader />
        </div>
        <div>
          <h4 className="text-center text-2xl font-bold text-slate-800">
            Sit Tight
          </h4>
          <p className="text-center text-xs text-gray-500">
            A better user experience is loading...
          </p>
        </div>
      </main>
    </>
  );
};

export default Loader;
