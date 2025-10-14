import BoringAvatar from "boring-avatars";
import { round } from "lodash";
import { DateTime } from "luxon";
import mapboxgl from "mapbox-gl";
import { createElement, useEffect, useRef, useState } from "react";
// @ts-ignore - React 19 has built-in types
import { renderToStaticMarkup } from "react-dom/server";
import * as CountryFlags from "country-flag-icons/react/3x2";
import {
  Monitor,
  Smartphone,
  Link,
  Eye,
  MousePointerClick,
  Search,
  ExternalLink,
  Users,
  Mail,
  HelpCircle,
  DollarSign,
  Video,
  Handshake,
  FileText,
  ShoppingCart,
  Calendar,
  Headphones,
} from "lucide-react";
import { useTimelineSessions } from "./useTimelineSessions";
import { generateName } from "../../../../components/Avatar";
import { formatShortDuration, hour12, userLocale } from "../../../../lib/dateTimeUtils";
import type { GetSessionsResponse } from "../../../../api/analytics/userSessions";
import { useTimelineStore } from "../timelineStore";
import { extractDomain, getDisplayName } from "../../../../components/Channel";

// Generate avatar SVG using boring-avatars
function generateAvatarSVG(userId: string, size: number): string {
  const avatarElement = createElement(BoringAvatar, {
    size,
    name: userId,
    variant: "beam",
    colors: ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"],
  });
  return renderToStaticMarkup(avatarElement);
}

// Render country flag to static SVG
function renderCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const FlagComponent = CountryFlags[countryCode.toUpperCase() as keyof typeof CountryFlags];
  if (!FlagComponent) return "";
  const flagElement = createElement(FlagComponent, { className: "w-4 h-3 inline-block" });
  return renderToStaticMarkup(flagElement);
}

// Render device icon based on device type
function renderDeviceIcon(deviceType: string): string {
  const type = deviceType?.toLowerCase() || "";
  const Icon = type.includes("mobile") || type.includes("tablet") ? Smartphone : Monitor;
  const iconElement = createElement(Icon, { size: 14, className: "inline-block" });
  return renderToStaticMarkup(iconElement);
}

// Get channel icon component
function getChannelIconComponent(channel: string) {
  switch (channel) {
    case "Direct":
      return Link;
    case "Organic Search":
      return Search;
    case "Referral":
      return ExternalLink;
    case "Organic Social":
      return Users;
    case "Email":
      return Mail;
    case "Unknown":
      return HelpCircle;
    case "Paid Search":
      return Search;
    case "Paid Unknown":
      return DollarSign;
    case "Paid Social":
      return Users;
    case "Display":
      return Monitor;
    case "Organic Video":
      return Video;
    case "Affiliate":
      return Handshake;
    case "Content":
      return FileText;
    case "Organic Shopping":
      return ShoppingCart;
    case "Event":
      return Calendar;
    case "Audio":
      return Headphones;
    default:
      return null;
  }
}

// Render channel icon
function renderChannelIcon(channel: string): string {
  const IconComponent = getChannelIconComponent(channel);
  if (!IconComponent) return "";
  const iconElement = createElement(IconComponent, { size: 14, className: "inline-block" });
  return renderToStaticMarkup(iconElement);
}

// Get browser icon path
function getBrowserIconPath(browser: string): string {
  const BROWSER_TO_LOGO: Record<string, string> = {
    Chrome: "Chrome.svg",
    "Mobile Chrome": "Chrome.svg",
    Firefox: "Firefox.svg",
    "Mobile Firefox": "Firefox.svg",
    Safari: "Safari.svg",
    "Mobile Safari": "Safari.svg",
    Edge: "Edge.svg",
    Opera: "Opera.svg",
    Brave: "Brave.svg",
  };
  return BROWSER_TO_LOGO[browser] ? `/browsers/${BROWSER_TO_LOGO[browser]}` : "";
}

// Get OS icon path
function getOSIconPath(os: string): string {
  const OS_TO_LOGO: Record<string, string> = {
    Windows: "Windows.svg",
    Android: "Android.svg",
    android: "Android.svg",
    Linux: "Tux.svg",
    macOS: "macOS.svg",
    iOS: "Apple.svg",
    "Chrome OS": "Chrome.svg",
  };
  return OS_TO_LOGO[os] ? `/operating-systems/${OS_TO_LOGO[os]}` : "";
}

const SOURCE_ID = "timeline-sessions";
const CLUSTER_LAYER_ID = "timeline-clusters";
const CLUSTER_COUNT_LAYER_ID = "timeline-cluster-count";
const UNCLUSTERED_LAYER_ID = "timeline-unclustered-point";

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
  const markersMapRef = useRef<
    Map<string, { marker: mapboxgl.Marker; element: HTMLDivElement; cleanup: () => void }>
  >(new Map());
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
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "globe-tooltip",
        anchor: "top-left",
        offset: [-30, -30],
      });
    }

    // Add source if it doesn't exist
    if (!mapInstance.getSource(SOURCE_ID)) {
      mapInstance.addSource(SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 30, // Less aggressive clustering
      });

      // Add cluster circle layer
      mapInstance.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["all", ["has", "point_count"], [">=", ["get", "point_count"], 10]],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#3b82f6", 10, "#2563eb", 30, "#1d4ed8"],
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 30, 30],
        },
      });

      // Add cluster count layer
      mapInstance.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["all", ["has", "point_count"], [">=", ["get", "point_count"], 10]],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Add unclustered point layer (hidden, used for querying)
      mapInstance.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 0,
          "circle-opacity": 0,
        },
      });

      // Disable transitions on cluster layers
      mapInstance.setPaintProperty(CLUSTER_LAYER_ID, "circle-opacity-transition", { duration: 0 });
      mapInstance.setPaintProperty(CLUSTER_LAYER_ID, "circle-radius-transition", { duration: 0 });
      mapInstance.setPaintProperty(CLUSTER_LAYER_ID, "circle-color-transition", { duration: 0 });
      mapInstance.setPaintProperty(CLUSTER_COUNT_LAYER_ID, "text-opacity-transition", { duration: 0 });
    }

    // Handle cluster clicks
    const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID],
      });

      if (!features.length) return;

      const clusterId = features[0].properties?.cluster_id;
      const source = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || !zoom) return;

        const coordinates = (features[0].geometry as any).coordinates;
        mapInstance.easeTo({
          center: coordinates,
          zoom: zoom,
          duration: 500,
        });
      });
    };

    // Change cursor on cluster hover
    const handleClusterMouseEnter = () => {
      mapInstance.getCanvas().style.cursor = "pointer";
    };

    const handleClusterMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = "";
    };

    mapInstance.on("click", CLUSTER_LAYER_ID, handleClusterClick);
    mapInstance.on("mouseenter", CLUSTER_LAYER_ID, handleClusterMouseEnter);
    mapInstance.on("mouseleave", CLUSTER_LAYER_ID, handleClusterMouseLeave);

    return () => {
      mapInstance.off("click", CLUSTER_LAYER_ID, handleClusterClick);
      mapInstance.off("mouseenter", CLUSTER_LAYER_ID, handleClusterMouseEnter);
      mapInstance.off("mouseleave", CLUSTER_LAYER_ID, handleClusterMouseLeave);
    };
  }, [map, mapLoaded]);

  // Update GeoJSON data and HTML markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;
    const markersMap = markersMapRef.current;

    // Hide layers and markers if not in timeline view
    if (mapView !== "timeline") {
      // Hide layers
      if (mapInstance.getLayer(CLUSTER_LAYER_ID)) {
        mapInstance.setLayoutProperty(CLUSTER_LAYER_ID, "visibility", "none");
      }
      if (mapInstance.getLayer(CLUSTER_COUNT_LAYER_ID)) {
        mapInstance.setLayoutProperty(CLUSTER_COUNT_LAYER_ID, "visibility", "none");
      }

      // Remove all markers
      markersMap.forEach(({ marker, cleanup }) => {
        cleanup();
        marker.remove();
      });
      markersMap.clear();

      return;
    }

    // Show/hide cluster layers based on number of sessions
    const shouldShowClusters = activeSessions.length > 500;

    if (mapInstance.getLayer(CLUSTER_LAYER_ID)) {
      mapInstance.setLayoutProperty(
        CLUSTER_LAYER_ID,
        "visibility",
        shouldShowClusters ? "visible" : "none"
      );
    }
    if (mapInstance.getLayer(CLUSTER_COUNT_LAYER_ID)) {
      mapInstance.setLayoutProperty(
        CLUSTER_COUNT_LAYER_ID,
        "visibility",
        shouldShowClusters ? "visible" : "none"
      );
    }

    const source = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (!source) return;

    // Convert sessions to GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: activeSessions
        .filter(s => s.lat && s.lon)
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

    // Function to update HTML markers for unclustered points
    const updateMarkers = async () => {
      if (!mapInstance) return;

      let unclusteredFeatures: any[] = [];

      if (shouldShowClusters) {
        // When clustering is enabled, show unclustered points and expand small clusters
        const features = mapInstance.querySourceFeatures(SOURCE_ID, {
          sourceLayer: undefined,
        });

        const source = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;

        // Process features to handle small clusters
        const promises: Promise<void>[] = [];

        features.forEach(f => {
          if (!f.properties) return;

          if (!f.properties.cluster) {
            // Regular unclustered point
            unclusteredFeatures.push(f);
          } else if (f.properties.point_count && f.properties.point_count < 10) {
            // Small cluster - expand it to get individual points
            const promise = new Promise<void>((resolve) => {
              source.getClusterLeaves(
                f.properties!.cluster_id,
                f.properties!.point_count,
                0,
                (err, leaves) => {
                  if (!err && leaves) {
                    unclusteredFeatures.push(...leaves);
                  }
                  resolve();
                }
              );
            });
            promises.push(promise);
          }
          // Clusters with >= 10 points are shown as cluster circles, ignore them here
        });

        // Wait for all cluster expansions to complete
        await Promise.all(promises);
      } else {
        // When clustering is disabled, show all sessions as individual markers
        unclusteredFeatures = activeSessions
          .filter(s => s.lat && s.lon)
          .map(session => ({
            properties: session,
            geometry: {
              type: "Point" as const,
              coordinates: [round(session.lon, 4), round(session.lat, 4)],
            },
          }));
      }

      // Build set of current session IDs
      const currentSessionIds = new Set(
        unclusteredFeatures.map(f => f.properties?.session_id).filter(Boolean)
      );

      // Remove markers that are no longer unclustered
      const toRemove: string[] = [];
      markersMap.forEach(({ marker, cleanup }, sessionId) => {
        if (!currentSessionIds.has(sessionId)) {
          cleanup();
          marker.remove();
          toRemove.push(sessionId);
        }
      });
      toRemove.forEach(id => markersMap.delete(id));

      // Create or update markers for unclustered sessions
      unclusteredFeatures.forEach(feature => {
        if (!mapInstance) return;

        const session = feature.properties as GetSessionsResponse[number];
        if (!session?.session_id) return;

        const existing = markersMap.get(session.session_id);
        const [lng, lat] = (feature.geometry as any).coordinates;

        if (existing) {
          // Update position if needed
          const currentLngLat = existing.marker.getLngLat();
          if (currentLngLat.lng !== lng || currentLngLat.lat !== lat) {
            existing.marker.setLngLat([lng, lat]);
          }
        } else {
          // Create new marker
          const avatarContainer = document.createElement("div");
          avatarContainer.className = "timeline-avatar-marker";
          avatarContainer.style.cursor = "pointer";
          avatarContainer.style.borderRadius = "50%";
          avatarContainer.style.overflow = "hidden";
          avatarContainer.style.width = "32px";
          avatarContainer.style.height = "32px";
          avatarContainer.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

          const avatarSVG = generateAvatarSVG(session.user_id, 32);
          avatarContainer.innerHTML = avatarSVG;

          const marker = new mapboxgl.Marker({
            element: avatarContainer,
            anchor: "center",
          })
            .setLngLat([lng, lat])
            .addTo(mapInstance);

          // Add click event for tooltip
          const toggleTooltip = (e: MouseEvent) => {
          e.stopPropagation();
          if (!map.current || !popupRef.current) return;

          // If clicking the same marker that has the tooltip open, close it
          if (popupRef.current.isOpen() && openTooltipSessionIdRef.current === session.session_id) {
            popupRef.current.remove();
            openTooltipSessionIdRef.current = null;
            return;
          }

          // If clicking a different marker (or no tooltip is open), show this one
          if (popupRef.current.isOpen()) {
            popupRef.current.remove();
          }

          const avatarSVG = generateAvatarSVG(session.user_id, 36);
          const countryCode = session.country?.length === 2 ? session.country : "";
          const flagSVG = renderCountryFlag(countryCode);
          const deviceIconSVG = renderDeviceIcon(session.device_type || "");
          const browserIconPath = getBrowserIconPath(session.browser || "");
          const osIconPath = getOSIconPath(session.operating_system || "");

          // Duration formatting
          const durationDisplay = formatShortDuration(session.session_duration || 0);

          // Start time formatting
          const startTime = DateTime.fromSQL(session.session_start, { zone: "utc" })
            .setLocale(userLocale)
            .toLocal()
            .toFormat(hour12 ? "MMM d, h:mm a" : "dd MMM, HH:mm");

          // Pageview and event icons
          const pageviewIconSVG = renderToStaticMarkup(
            createElement(Eye, { size: 14, className: "inline-block text-blue-400" })
          );
          const eventIconSVG = renderToStaticMarkup(
            createElement(MousePointerClick, { size: 14, className: "inline-block text-amber-400" })
          );

          // Referrer/Channel display
          const domain = extractDomain(session.referrer);
          let referrerIconSVG = "";
          let referrerText = "";

          if (domain) {
            referrerText = getDisplayName(domain);
            referrerIconSVG = renderChannelIcon(session.channel);
          } else {
            referrerText = session.channel;
            referrerIconSVG = renderChannelIcon(session.channel);
          }

          const name = generateName(session.user_id);

          const html = `
              <div class="flex flex-col gap-3 p-3 bg-neutral-850 border border-neutral-750 rounded-lg">
                <div class="flex items-start gap-2.5">
                  <div class="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden">
                    ${avatarSVG}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold text-white truncate">${name}</h3>
                    <div class="flex items-center gap-1 text-xs text-neutral-300 mt-0.5">
                      ${flagSVG}
                      <span>${session.city || "Unknown"}, ${session.country || "Unknown"}</span>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  ${browserIconPath ? `<img src="${browserIconPath}" alt="${session.browser}" title="${session.browser}" class="w-4 h-4" />` : ""}
                  ${osIconPath ? `<img src="${osIconPath}" alt="${session.operating_system}" title="${session.operating_system}" class="w-4 h-4" />` : ""}
                  <span class="flex items-center" title="${session.device_type}">${deviceIconSVG}</span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-xs">
                    ${pageviewIconSVG}
                    <span>${session.pageviews || 0}</span>
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-xs">
                    ${eventIconSVG}
                    <span>${session.events || 0}</span>
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-xs">
                    ${referrerIconSVG}
                    <span>${referrerText}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2 text-xs text-neutral-400 pt-1.5 border-t border-neutral-700">
                  <span>${startTime}</span>
                  <span class="text-neutral-200">${durationDisplay}</span>
                </div>
                <button
                  class="view-session-btn w-full px-2 py-1 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded transition-colors"
                  data-session-id="${session.session_id}"
                  tabindex="-1"
                >
                  View Details
                </button>
              </div>
            `;

          popupRef.current.setLngLat([lng, lat]).setHTML(html).addTo(map.current);
          openTooltipSessionIdRef.current = session.session_id;

          // Add click handler to the button
          const button = document.querySelector(`[data-session-id="${session.session_id}"]`);
          if (button) {
            button.addEventListener("click", e => {
              e.stopPropagation();
              setSelectedSession(session);
              popupRef.current?.remove();
              openTooltipSessionIdRef.current = null;
            });
          }
        };

        avatarContainer.addEventListener("click", toggleTooltip);

          // Create cleanup function to remove event listener
          const cleanup = () => {
            avatarContainer.removeEventListener("click", toggleTooltip);
          };

          // Store marker with cleanup function
          markersMap.set(session.session_id, { marker, element: avatarContainer, cleanup });
        }
      });
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
      markersMap.forEach(({ marker, cleanup }) => {
        cleanup();
        marker.remove();
      });
      markersMap.clear();

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
