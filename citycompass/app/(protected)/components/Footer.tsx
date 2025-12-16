"use client";
import * as React from "react"
// import [] from "@components/ui"
import Link from "next/link";
import {Github} from 'lucide-react';

const Platform_features = [
    {
        title:"Interactive Map",
        link:"/map"
    },
    {
        title:"Community Survey",
        link:"/survey"
    },
    {
        title:"ML Insights",
        link:"/insights"
    },
    {
        title:"Compare Areas",
        link:"/compare"
    },
]

const Resources = [
    {
        title: "About Project",
        link: "/"
    },
    {
        title: "Methodlogy",
        link: "/methodology"
    },
    {
        title: "Privacy Policy",
        link: "/Privacy_Policy"
    },
    {
        title: "Accessibility",
        link: "/Accessability"
    },

]

const Footer = () => {
    return (
        <div className=" flex flex-row border-t-2 border-primary gap-20 mx-auto mt-auto justify-between px-24 py-8 w-[80%]  
        ">
                <div className="flex flex-col  m-4">
                    <h1 className="text-xl font-semibold"> 
                        NYC Analytics
                    </h1>
                    <p className="text-sm"> 
                        Empowering NYC Communities through data-driven neighborhood insights 
                    </p>
                </div>

                <div>
                    <h1 className="text-xl font-semibold">Platform</h1>
                    <ul>
                        {Platform_features.map((feature,index) => (
                            <li key={index} className="text-sm">
                                <Link href={feature.link}>
                                {feature.title}
                                </Link>
                            </li>
                        ))}

                    </ul>
                </div>

                <div>
                    <h1 className="text-xl font-semibold">Resources</h1>
                    <ul>
                        {Resources.map((resource,index) => (
                            <li key={index} className="text-sm">
                                <Link href={resource.link}>
                                {resource.title}
                                </Link>
                            </li>
                        ))}

                    </ul>
                </div>

                <div>
                    <h1 className="font-semibold">Connect</h1>
                    <div>
                        <Github />
                    </div>
                </div>
        
        </div>
    )
}

export default Footer