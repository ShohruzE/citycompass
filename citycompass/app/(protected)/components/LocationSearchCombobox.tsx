"use client";

import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Building2, Map, Home } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchLocations, type Location, type LocationType, getDisplayNameForZip } from "@/lib/data/nyc-locations";

interface LocationSearchComboboxProps {
  value: string; // Current zip code
  onChange: (zipCode: string, location: Location | null) => void;
  disabled?: boolean;
}

const locationTypeConfig = {
  zip: { icon: Home, label: "ZIP Code", color: "text-blue-600" },
  neighborhood: { icon: MapPin, label: "Neighborhood", color: "text-green-600" },
  district: { icon: Building2, label: "District", color: "text-purple-600" },
  borough: { icon: Map, label: "Borough", color: "text-orange-600" },
};

export function LocationSearchCombobox({
  value,
  onChange,
  disabled = false,
}: LocationSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);

  // Search results based on query
  const searchResults = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return [];
    }
    return searchLocations(searchQuery, 30);
  }, [searchQuery]);

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<LocationType, Location[]> = {
      neighborhood: [],
      district: [],
      borough: [],
      zip: [],
    };

    searchResults.forEach((location) => {
      groups[location.type].push(location);
    });

    return groups;
  }, [searchResults]);

  const handleSelect = (location: Location) => {
    setSelectedLocation(location);
    onChange(location.zipCode, location);
    setOpen(false);
    setSearchQuery("");
  };

  // Display text for the button
  const displayText = React.useMemo(() => {
    if (selectedLocation) {
      return selectedLocation.label;
    }
    if (value) {
      return getDisplayNameForZip(value) || value;
    }
    return "Search location...";
  }, [selectedLocation, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Search for a location by ZIP code, neighborhood, district, or borough"
          disabled={disabled}
          className="w-full justify-between text-left font-normal h-11 bg-background hover:bg-accent transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{displayText}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by ZIP, neighborhood, or borough..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {searchQuery && searchResults.length === 0 && (
              <CommandEmpty>No locations found.</CommandEmpty>
            )}

            {!searchQuery && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Start typing to search locations
              </div>
            )}

            {/* Neighborhoods */}
            {groupedResults.neighborhood.length > 0 && (
              <CommandGroup heading="Neighborhoods">
                {groupedResults.neighborhood.map((location) => {
                  const Icon = locationTypeConfig.neighborhood.icon;
                  const isSelected = value === location.zipCode && selectedLocation?.id === location.id;
                  return (
                    <CommandItem
                      key={location.id}
                      value={location.id}
                      onSelect={() => handleSelect(location)}
                      className="cursor-pointer"
                    >
                      <Icon className={cn("mr-2 h-4 w-4", locationTypeConfig.neighborhood.color)} />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span>{location.label}</span>
                          {location.borough && (
                            <span className="text-xs text-muted-foreground">
                              {location.borough} • ZIP {location.zipCode}
                            </span>
                          )}
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Community Districts */}
            {groupedResults.district.length > 0 && (
              <CommandGroup heading="Community Districts">
                {groupedResults.district.map((location) => {
                  const Icon = locationTypeConfig.district.icon;
                  const isSelected = value === location.zipCode && selectedLocation?.id === location.id;
                  return (
                    <CommandItem
                      key={location.id}
                      value={location.id}
                      onSelect={() => handleSelect(location)}
                      className="cursor-pointer"
                    >
                      <Icon className={cn("mr-2 h-4 w-4", locationTypeConfig.district.color)} />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm">{location.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ZIP {location.zipCode}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Boroughs */}
            {groupedResults.borough.length > 0 && (
              <CommandGroup heading="Boroughs">
                {groupedResults.borough.map((location) => {
                  const Icon = locationTypeConfig.borough.icon;
                  const isSelected = value === location.zipCode && selectedLocation?.id === location.id;
                  return (
                    <CommandItem
                      key={location.id}
                      value={location.id}
                      onSelect={() => handleSelect(location)}
                      className="cursor-pointer"
                    >
                      <Icon className={cn("mr-2 h-4 w-4", locationTypeConfig.borough.color)} />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span>{location.label}</span>
                          <span className="text-xs text-muted-foreground">
                            Representative ZIP {location.zipCode}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* ZIP Codes */}
            {groupedResults.zip.length > 0 && (
              <CommandGroup heading="ZIP Codes">
                {groupedResults.zip.slice(0, 10).map((location) => {
                  const Icon = locationTypeConfig.zip.icon;
                  const isSelected = value === location.zipCode;
                  return (
                    <CommandItem
                      key={location.id}
                      value={location.id}
                      onSelect={() => handleSelect(location)}
                      className="cursor-pointer"
                    >
                      <Icon className={cn("mr-2 h-4 w-4", locationTypeConfig.zip.color)} />
                      <div className="flex-1 flex items-center justify-between">
                        <span>{location.label}</span>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

