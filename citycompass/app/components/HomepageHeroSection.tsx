
'use client';
import * as React from "react"
import {Users, BarChart3, MapPin, ArrowRight} from "lucide-react";
import {Button} from "@/components/ui/button";

const HomepageHeroSection = () =>{
    return (

    <div className="w-[50%] mx-auto flex flex-col justify-center items-center">

        <h1 className="text-[50px] font-bold text-center">
          Understanding NYC 
        </h1> 

        <h1 className="px-5 text-[#00a6ae] text-[50px] font-bold text-center">
          Neighborhoods
        </h1>

        <h1 className="text-[50px] font-bold text-center"> 
          Through Community Voice
        </h1>

        <p className="text-center pt-8 text-gray-500 font-medium">
          Empowering residents, politicians, and government workers with data-driven insights about
          neighborhood safety, cleanliness, and quality of life across New York City.
        </p>

        <div className="flex pt-8 items-center justify-between flex-row gap-8">
          <Button>Share Your Voice <ArrowRight/></Button>

          <Button>Explore Map <ArrowRight/></Button>
        </div>


        <div className="flex flex-row justify-center gap-24 mt-12">

            <div className="flex justify-center items-center flex-col">
                <div className="rounded-full bg-secondary p-4">
                    <Users  className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold">5 Boroughs</h4>
                <p className="text-md">Complete Coverage</p>
            </div>

           <div className="flex justify-center items-center flex-col">
                <div className="rounded-full bg-secondary p-4">
                    <BarChart3  className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold">5 Boroughs</h4>
                <p className="text-md">Complete Coverage</p>
            </div>

            <div className="flex justify-center items-center flex-col">
                <div className="rounded-full bg-secondary p-4">
                    <MapPin  className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold">5 Boroughs</h4>
                <p className="text-md">Complete Coverage</p>
            </div>

        </div>
      </div>

    )
}

export default HomepageHeroSection;
