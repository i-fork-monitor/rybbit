import mapboxgl from "mapbox-gl";
import { isNil, round } from "lodash";
import type { GetSessionsResponse } from "../../../../../api/analytics/userSessions";
import { CLUSTER_LAYER_ID, CLUSTER_COUNT_LAYER_ID, SOURCE_ID } from "./timelineLayerConstants";

/**
 * Toggle visibility of cluster layers
 */
export function setClusterLayersVisibility(mapInstance: mapboxgl.Map, visible: boolean): void {
  const visibility = visible ? "visible" : "none";

  if (mapInstance.getLayer(CLUSTER_LAYER_ID)) {
    mapInstance.setLayoutProperty(CLUSTER_LAYER_ID, "visibility", visibility);
  }
  if (mapInstance.getLayer(CLUSTER_COUNT_LAYER_ID)) {
    mapInstance.setLayoutProperty(CLUSTER_COUNT_LAYER_ID, "visibility", visibility);
  }
}

/**
 * Update the GeoJSON data source with active sessions
 */
export function updateGeoJSONData(mapInstance: mapboxgl.Map, activeSessions: GetSessionsResponse): void {
  const source = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
  if (!source) return;

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: activeSessions
      .filter(s => !isNil(s.lat) && !isNil(s.lon))
      .map(session => ({
        type: "Feature",
        properties: session,
        geometry: {
          type: "Point",
          coordinates: [round(session.lon, 4), round(session.lat, 4)],
        },
      })),
  };

  source.setData(geojson);
}
