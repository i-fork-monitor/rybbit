import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { useTimelineSessions } from "../useTimelineSessions";
import type { GetSessionsResponse } from "../../../../../api/analytics/userSessions";
import { useTimelineStore } from "../../timelineStore";
import { initializeClusterSource, setupClusterClickHandler } from "./timelineClusterUtils";
import {
  SOURCE_ID,
  CLUSTER_LAYER_ID,
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  CLUSTERING_THRESHOLD,
} from "./timelineLayerConstants";
import { setClusterLayersVisibility, updateGeoJSONData } from "./timelineLayerManager";
import { updateMarkers as updateMarkersUtil, clearAllMarkers, type MarkerData } from "./timelineMarkerManager";
import {
  createTooltipPopup,
  addClusterLayers,
  disableClusterTransitions,
  setupClusterHoverHandlers,
} from "./timelineLayerSetup";

export function useTimelineLayer({
  map,
  mapLoaded,
  mapView,
}: {
  map: React.RefObject<mapboxgl.Map | null>;
  mapLoaded: boolean;
  mapView: string;
}) {
  const { activeSessions } = useTimelineSessions();
  const { currentTime } = useTimelineStore();
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersMapRef = useRef<Map<string, MarkerData>>(new Map());
  const openTooltipSessionIdRef = useRef<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<GetSessionsResponse[number] | null>(null);

  // Close tooltip when timeline time changes
  useEffect(() => {
    if (popupRef.current && popupRef.current.isOpen()) {
      popupRef.current.remove();
      openTooltipSessionIdRef.current = null;
    }
  }, [currentTime]);

  // Initialize Mapbox source and layers for clustering
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    // Initialize popup once
    if (!popupRef.current) {
      popupRef.current = createTooltipPopup();
    }

    // Add source and layers if they don't exist
    if (!mapInstance.getSource(SOURCE_ID)) {
      initializeClusterSource(mapInstance, CLUSTER_MAX_ZOOM, CLUSTER_RADIUS);
      addClusterLayers(mapInstance);
      disableClusterTransitions(mapInstance);
    }

    // Setup interaction handlers
    const cleanupClusterClick = setupClusterClickHandler(mapInstance, CLUSTER_LAYER_ID);
    const cleanupClusterHover = setupClusterHoverHandlers(mapInstance, CLUSTER_LAYER_ID);

    return () => {
      cleanupClusterClick();
      cleanupClusterHover();
    };
  }, [map, mapLoaded]);

  // Update GeoJSON data and HTML markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;
    const markersMap = markersMapRef.current;

    // Hide layers and markers if not in timeline view
    if (mapView !== "timeline") {
      setClusterLayersVisibility(mapInstance, false);
      clearAllMarkers(markersMap);
      return;
    }

    // Show/hide cluster layers based on number of sessions
    const shouldShowClusters = activeSessions.length > CLUSTERING_THRESHOLD;
    setClusterLayersVisibility(mapInstance, shouldShowClusters);

    // Update GeoJSON data source
    updateGeoJSONData(mapInstance, activeSessions);

    // Function to update HTML markers for unclustered points
    const updateMarkers = async () => {
      await updateMarkersUtil(
        mapInstance,
        markersMap,
        shouldShowClusters,
        activeSessions,
        popupRef,
        openTooltipSessionIdRef,
        map,
        setSelectedSession
      );
    };

    // Initial update
    updateMarkers();

    // Update markers on zoom and move
    mapInstance.on("zoom", updateMarkers);
    mapInstance.on("move", updateMarkers);
    mapInstance.on("sourcedata", updateMarkers);

    // Handle map click to close tooltip
    const handleMapClick = () => {
      if (popupRef.current && popupRef.current.isOpen()) {
        popupRef.current.remove();
        openTooltipSessionIdRef.current = null;
      }
    };

    mapInstance.on("click", handleMapClick);

    // Cleanup function
    return () => {
      clearAllMarkers(markersMap);
      mapInstance.off("zoom", updateMarkers);
      mapInstance.off("move", updateMarkers);
      mapInstance.off("sourcedata", updateMarkers);
      mapInstance.off("click", handleMapClick);
    };
  }, [activeSessions, mapLoaded, map, mapView]);

  return {
    selectedSession,
    setSelectedSession,
  };
}
