import { Clock, Globe2, HouseIcon, Radio } from "lucide-react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobeStore } from "../globeStore";

export type MapView = "countries" | "subdivisions" | "coordinates" | "timeline";

export default function MapViewSelector() {
  const { mapView, setMapView } = useGlobeStore();

  const mapViewToTab: Record<MapView, string> = {
    coordinates: "tab-1",
    countries: "tab-2",
    subdivisions: "tab-3",
    timeline: "tab-4",
  };

  return (
    <Tabs value={mapViewToTab[mapView]}>
      <ScrollArea>
        <TabsList>
          <TabsTrigger value="tab-4" className="group" onClick={() => setMapView("timeline")}>
            <Clock className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="tab-1" className="group" onClick={() => setMapView("coordinates")}>
            <Radio className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Coordinates
          </TabsTrigger>
          <TabsTrigger value="tab-2" onClick={() => setMapView("countries")}>
            <Globe2 className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Countries
          </TabsTrigger>
          <TabsTrigger value="tab-3" className="group" onClick={() => setMapView("subdivisions")}>
            <HouseIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
            Subdivisions
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Tabs>
  );
}
