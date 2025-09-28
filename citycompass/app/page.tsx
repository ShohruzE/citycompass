import Image from "next/image";
import Link from 'next/link';
import ProductCard from "./components/ProductCard";
import { Button } from "@/components/ui/button"
import { NavBar } from "./components/NavBar";

export default function Home() {
  return (
    <main>
      <NavBar />
      <div className="flex max-w-3xl justify-center align-items-center items-center flex-col  ">

        <h1 className=" text-[50px] font-bold ">
          Understanding NYC <span className="px-5 text-[#00a6ae]">Neighborhoods</span>
          Through Community Voice 
        </h1>

        <p>
          Empowering residents, politicians, and government workers with data-driven insights about
           neighborhood safety, cleanliness, and quality of life across New York City.
        </p>
      </div>

    </main>
  );
}
