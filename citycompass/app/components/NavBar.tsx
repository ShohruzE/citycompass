"use client"

import * as React from "react"
import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"



export function NavBar() {
  return (<NavigationMenu className="w-full ">
<NavigationMenuList className="">
        {/* <div className="flex items-center gap-4"> */}
      <NavigationMenuItem>...logo/home...</NavigationMenuItem>
    {/* </div> */}

    {/* <div className="flex items-center gap-6 ml-auto"> */}
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="/">Home</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>

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

      <NavigationMenuItem>
        <Link href="/sign_in"> <Button>Sign In</Button></Link>
      </NavigationMenuItem>

      <NavigationMenuItem>
          <Link href="/sign_in"><Button >Get Started </Button></Link>
      </NavigationMenuItem>
    {/* </div> */}
  </NavigationMenuList>
  
</NavigationMenu>
  )
}

