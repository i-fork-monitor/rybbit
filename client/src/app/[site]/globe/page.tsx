"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useRef } from "react";
import "./globe.css";

import { DisabledOverlay } from "../../../components/DisabledOverlay";
import { NothingFound } from "../../../components/NothingFound";
import { useSetPageTitle } from "../../../hooks/useSetPageTitle";
import { SubHeader } from "../components/SubHeader/SubHeader";
import { GlobeSessions } from "./components/GlobeSessions";
import MapViewSelector from "./components/ModeSelector";
import { TimelineScrubber } from "./components/TimelineScrubber";
import { useGlobeStore } from "./globeStore";
import { useCoordinatesLayer } from "./hooks/useCoordinatesLayer";
import { useCountriesLayer } from "./hooks/useCountriesLayer";
import { useLayerVisibility } from "./hooks/useLayerVisibility";
import { useMapbox } from "./hooks/useMapbox";
import { useSubdivisionsLayer } from "./hooks/useSubdivisionsLayer";
import { useTimelineLayer } from "./hooks/useTimelineLayer";

export default function GlobePage() {
  useSetPageTitle("Rybbit · Globe");
  const mapContainer = useRef<HTMLDivElement>(null);

  const mapView = useGlobeStore(state => state.mapView);

  const { map, mapLoaded } = useMapbox(mapContainer);

  useCountriesLayer({
    map,
    mapLoaded,
    mapView,
  });

  useSubdivisionsLayer({
    map,
    mapLoaded,
    mapView,
  });

  useCoordinatesLayer({
    map,
    mapLoaded,
    minutes: 30,
    mapView,
  });

  useTimelineLayer({
    map,
    mapLoaded,
    mapView,
  });

  useLayerVisibility(map, mapView, mapLoaded);

  return (
    <DisabledOverlay message="Globe" featurePath="globe">
      <div className="relative w-full h-dvh overflow-hidden">
        <div className="p-2 md:p-4 relative z-50">
          <SubHeader />
        </div>
        <div className="absolute top-0 left-0 right-0 bottom-0 z-10">
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
            <div
              ref={mapContainer}
              className="w-full h-full [&_.mapboxgl-ctrl-bottom-left]:!hidden [&_.mapboxgl-ctrl-logo]:!hidden"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <NothingFound
                title="Mapbox access token not found"
                description={
                  <p className="text-sm max-w-[600px] text-center">
                    Please set the <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> environment variable and rebuild all
                    containers. To get a Mapbox token, please visit{" "}
                    <a
                      href="https://docs.mapbox.com/help/dive-deeper/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Mapbox
                    </a>{" "}
                    and create an account.
                  </p>
                }
              />
            </div>
          )}
          <div className="absolute bottom-2 left-4 z-99999 w-full flex flex-col gap-2">
            {mapView !== "timeline" && <GlobeSessions />}
            <MapViewSelector />
            {mapView === "timeline" && <TimelineScrubber />}
          </div>
        </div>
      </div>
    </DisabledOverlay>
  );
}
