'use client';
import * as React from "react";
import {Map, Users, BarChart3, Vote, Shield, Sparkles} from 'lucide-react';
import {Card, CardContent, CardTitle ,CardDescription, CardHeader} from '@/components/ui/card'

const features = [
    {
        icon:Map,
        title: "Interactive Neighborhood Map",
        description:"Explore NYC neighborhoods with color-coded scoring based on safety, cleanliness, and quality of life metrics",
        color: "text-primary",
    },
    {
        icon: Users,
        title: "Community Surveys",
        description: "Accessible survey system with multi-language support and screen reader compatibility for all residents.",
        color: "text-primary",
    },
    {
        icon: BarChart3,
        title: "ML-Powered Insights",
        description: "Advanced machine learning models provide 6-month forecasts and trend analysis for neighborhood metrics.",
        color: "text-primary",
    },
    {
        icon: Vote,
        title: "Policy Recommendations",
        description: "Side-by-side comparison tools allow users to analyze different areas across multiple metrics.",
        color: "text-primary",
    },
    {
        icon: Shield,
        title: "Neighborhood comparison",
        description: "ide-by-side comparison tools allow users to analyze different areas across multiple metrics.",
        color: "text-primary",
    },
    {
        icon: Sparkles,
        title: "Real-Time Analytics",
        description: "Live data aggregation from NYC Open Data sources combined with resident feedback for comprehensive insights.",
        color: "text-primary",
    },
]


const FeatureGrid = () => {
    return (
        <div className="w-full my-12 mt-20">
            <div className="flex flex-col items-center  mb-8 ">
                <h1 className="text-3xl font-bold">Comprehensive Platform Features</h1>
                <p className="text-lg text-grey-600"></p>
            </div>

            <div className="flex justify-center">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-[60%]">
                    {features.map((feature, index) => (
                        <Card key={index} className="  border-0 shadow-sm hover:shadow-md transition-shadow"> 
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg bg-background flex items-center justify-center mb-4`}>
                                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                </div>

                                <CardTitle>{feature.title}</CardTitle>
                                <CardDescription>Card Description</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p>Card Content</p>
                            </CardContent>
                        </Card>
                    ))}
                    
                </div>


                

            </div>
        </div>
    )
}


export default FeatureGrid