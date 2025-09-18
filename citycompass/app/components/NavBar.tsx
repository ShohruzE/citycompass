'use client';

import * as React from "react"
import Link from "next/link"
import { MapPin} from 'lucide-react';
import { Button } from "@/components/ui/button"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"



export function NavBar() {
  return (
  <div className="justify-between flex flex-row p-4 border-b-2 mb-8">
    
  <NavigationMenu className="w-full ">
    <NavigationMenuList className="">

      <NavigationMenuItem className="flex flex-row">
        <MapPin className="w-8 h-8 text-blue-500 " />

        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/" className="flex flex-row">
            
            <h1 className="text-2xl">NYC Analytics</h1>
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

    </NavigationMenuList>
  </NavigationMenu>


  <NavigationMenu className="w-full ">
    <NavigationMenuList className="">

      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/map">Interactive Map</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/survey">Take Survey</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/insights">Insights</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/compare">Compare</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

    </NavigationMenuList>
  </NavigationMenu>
    

  <NavigationMenu className="w-full ">
    <NavigationMenuList className="">

      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/map"><Button> Sign In </Button> </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/map"><Button> Get Started </Button> </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

    </NavigationMenuList>
  </NavigationMenu>



  </div>
  )
}

