'use client';
import * as React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

const features = [
    {
        number: "100+",
        title: "Neighbohoods Covered",
        description: "Comprehensive data across all NYC boroughs",
    },
    {
        number: "95%",
        title: "Accuracy Rate",
        description: "ML model prediction accuracy for neighborhood trends",
    },
    {
        number: "24/7",
        title: "Data Updates",
        description: "Real-time integration with NYC Open Data sources",
    },
    {
        number: "3",
        title: "User Types",
        description: "Serving residents, politicians, and government workers",
    },

]

const PlatformImpact = () => {
    return (
        <section className="mb-10"> 
            <div className="flex flex-col items-center p-8">   

                <h1 className=" text-4xl font-bold text-primary p-4"> 
                    Platform Impact 
                </h1>

                <p className="  "> 
                    Trusted by the NYC community for accurate, accessible neighborhood insights. 
                </p>

            </div>

            <div className="flex justify-center flex-row">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-[70%]">
                    {features.map((feature, index) => ( 

                        <Card key={index} className=" items-center border-0 shadow-sm hover:shadow-md transition-shadow"> 
                            <CardHeader className="w-[90%]">

                                <CardTitle className="text-4xl text-center" >{feature.number}</CardTitle>
                                <CardDescription className="text-lg text-center">{feature.title}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-center">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>


        </section>
    )    
}

export default PlatformImpact