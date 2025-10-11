import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from "@react-email/components";
import * as React from "react";
import type { OrganizationReport } from "../../../services/weeklyReportTypes.js";

interface WeeklyReportEmailProps {
  userName: string;
  organizationReport: OrganizationReport;
}

const calculateGrowth = (current: number | null | undefined, previous: number | null | undefined): string => {
  const curr = current ?? 0;
  const prev = previous ?? 0;

  if (prev === 0) {
    return curr > 0 ? "+100%" : "0%";
  }
  const growth = ((curr - prev) / prev) * 100;
  const sign = growth > 0 ? "+" : "";
  return `${sign}${growth.toFixed(1)}%`;
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const formatNumber = (num: number | null | undefined): string => {
  if (num == null || isNaN(num)) {
    return "0";
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(0);
};

const safeToFixed = (num: number | null | undefined, decimals: number = 1): string => {
  if (num == null || isNaN(num)) {
    return "0";
  }
  return num.toFixed(decimals);
};

const regionNamesInEnglish = new Intl.DisplayNames(["en"], { type: "region" });

const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getCountryDisplay = (countryCode: string): string => {
  try {
    const flag = getCountryFlag(countryCode);
    const name = regionNamesInEnglish.of(countryCode.toUpperCase()) || countryCode;
    return `${flag} ${name}`;
  } catch (error) {
    return countryCode;
  }
};

export const WeeklyReportEmail = ({ userName, organizationReport }: WeeklyReportEmailProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>Weekly Analytics Report for {organizationReport.organizationName}</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: "#10b981",
                lightBg: "#ffffff",
                cardBg: "#f9fafb",
                darkText: "#111827",
                mutedText: "#6b7280",
                borderColor: "#e5e7eb",
                positive: "#10b981",
                negative: "#ef4444",
              },
            },
          },
        }}
      >
        <Body className="bg-lightBg font-sans">
          <Container className="mx-auto py-10 px-6 max-w-[600px]">
            {/* Header */}
            <Section className="text-center mb-8">
              <div className="inline-block bg-brand/10 text-brand px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                Weekly Report
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${organizationReport.sites[0].siteDomain}&sz=32`}
                  alt=""
                  width="24"
                  height="24"
                  className="rounded"
                />
                <Heading className="text-darkText text-3xl font-semibold m-0">
                  {organizationReport.sites[0].siteName}
                </Heading>
              </div>
              <Text className="text-mutedText text-base">Hi {userName}, here's your weekly analytics summary</Text>
            </Section>

            {/* Sites Reports */}
            {organizationReport.sites.map(site => (
              <Section key={site.siteId} className="mb-10">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Sessions Card */}
                  <div className="bg-cardBg border border-borderColor rounded-lg p-4">
                    <Text className="text-mutedText text-xs mb-1 mt-0">Sessions</Text>
                    <div className="flex items-baseline gap-2">
                      <Text className="text-darkText text-2xl font-bold m-0">
                        {formatNumber(site.currentWeek.sessions)}
                      </Text>
                      <Text
                        className={`text-xs font-medium m-0 ${
                          site.currentWeek.sessions >= site.previousWeek.sessions ? "text-positive" : "text-negative"
                        }`}
                      >
                        {calculateGrowth(site.currentWeek.sessions, site.previousWeek.sessions)}
                      </Text>
                    </div>
                  </div>

                  {/* Pageviews Card */}
                  <div className="bg-cardBg border border-borderColor rounded-lg p-4">
                    <Text className="text-mutedText text-xs mb-1 mt-0">Pageviews</Text>
                    <div className="flex items-baseline gap-2">
                      <Text className="text-darkText text-2xl font-bold m-0">
                        {formatNumber(site.currentWeek.pageviews)}
                      </Text>
                      <Text
                        className={`text-xs font-medium m-0 ${
                          site.currentWeek.pageviews >= site.previousWeek.pageviews ? "text-positive" : "text-negative"
                        }`}
                      >
                        {calculateGrowth(site.currentWeek.pageviews, site.previousWeek.pageviews)}
                      </Text>
                    </div>
                  </div>

                  {/* Users Card */}
                  <div className="bg-cardBg border border-borderColor rounded-lg p-4">
                    <Text className="text-mutedText text-xs mb-1 mt-0">Unique Users</Text>
                    <div className="flex items-baseline gap-2">
                      <Text className="text-darkText text-2xl font-bold m-0">
                        {formatNumber(site.currentWeek.users)}
                      </Text>
                      <Text
                        className={`text-xs font-medium m-0 ${
                          site.currentWeek.users >= site.previousWeek.users ? "text-positive" : "text-negative"
                        }`}
                      >
                        {calculateGrowth(site.currentWeek.users, site.previousWeek.users)}
                      </Text>
                    </div>
                  </div>

                  {/* Avg Duration Card */}
                  <div className="bg-cardBg border border-borderColor rounded-lg p-4">
                    <Text className="text-mutedText text-xs mb-1 mt-0">Avg Duration</Text>
                    <div className="flex items-baseline gap-2">
                      <Text className="text-darkText text-2xl font-bold m-0">
                        {formatDuration(site.currentWeek.session_duration)}
                      </Text>
                      <Text
                        className={`text-xs font-medium m-0 ${
                          site.currentWeek.session_duration >= site.previousWeek.session_duration
                            ? "text-positive"
                            : "text-negative"
                        }`}
                      >
                        {calculateGrowth(site.currentWeek.session_duration, site.previousWeek.session_duration)}
                      </Text>
                    </div>
                  </div>

                  {/* Pages/Session Card */}
                  <div className="bg-cardBg border border-borderColor rounded-lg p-4">
                    <Text className="text-mutedText text-xs mb-1 mt-0">Pages/Session</Text>
                    <div className="flex items-baseline gap-2">
                      <Text className="text-darkText text-2xl font-bold m-0">
                        {safeToFixed(site.currentWeek.pages_per_session, 1)}
                      </Text>
                      <Text
                        className={`text-xs font-medium m-0 ${
                          (site.currentWeek.pages_per_session ?? 0) >= (site.previousWeek.pages_per_session ?? 0)
                            ? "text-positive"
                            : "text-negative"
                        }`}
                      >
                        {calculateGrowth(site.currentWeek.pages_per_session, site.previousWeek.pages_per_session)}
                      </Text>
                    </div>
                  </div>

                  {/* Bounce Rate Card */}
                  <div className="bg-cardBg border border-borderColor rounded-lg p-4">
                    <Text className="text-mutedText text-xs mb-1 mt-0">Bounce Rate</Text>
                    <div className="flex items-baseline gap-2">
                      <Text className="text-darkText text-2xl font-bold m-0">
                        {safeToFixed(site.currentWeek.bounce_rate, 1)}%
                      </Text>
                      <Text
                        className={`text-xs font-medium m-0 ${
                          (site.currentWeek.bounce_rate ?? 0) <= (site.previousWeek.bounce_rate ?? 0)
                            ? "text-positive"
                            : "text-negative"
                        }`}
                      >
                        {calculateGrowth(site.currentWeek.bounce_rate, site.previousWeek.bounce_rate)}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Top Lists Section */}
                <div className="mb-6">
                  {/* Top Countries */}
                  {site.topCountries.length > 0 && (
                    <div className="bg-cardBg border border-borderColor rounded-lg p-4 mb-4">
                      <Text className="text-darkText text-sm font-semibold mb-3 mt-0">Top Countries</Text>
                      {site.topCountries.map((country, index) => {
                        const ratio = site.topCountries[0]?.percentage ? 100 / site.topCountries[0].percentage : 1;
                        const barWidth = (country.percentage ?? 0) * ratio;
                        return (
                          <div
                            key={index}
                            style={{
                              position: "relative",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              marginBottom: index < site.topCountries.length - 1 ? "8px" : "0",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: `${barWidth}%`,
                                backgroundColor: "#10b981",
                                opacity: 0.25,
                                borderRadius: "6px",
                                paddingTop: "8px",
                                paddingBottom: "8px",
                              }}
                            />
                            <div
                              style={{
                                position: "relative",
                                zIndex: 10,
                                marginLeft: "8px",
                                marginRight: "8px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <Text className="text-darkText text-sm m-0">{getCountryDisplay(country.value)}</Text>
                              <div className="flex items-center gap-3">
                                <Text className="text-mutedText text-xs m-0">
                                  {safeToFixed(country.percentage, 1)}%
                                </Text>
                                <Text className="text-darkText text-sm font-medium m-0">
                                  {formatNumber(country.count)}
                                </Text>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Top Pages */}
                  {site.topPages.length > 0 && (
                    <div className="bg-cardBg border border-borderColor rounded-lg p-4 mb-4">
                      <Text className="text-darkText text-sm font-semibold mb-3 mt-0">Top Pages</Text>
                      {site.topPages.map((page, index) => {
                        const ratio = site.topPages[0]?.percentage ? 100 / site.topPages[0].percentage : 1;
                        const barWidth = (page.percentage ?? 0) * ratio;
                        return (
                          <div
                            key={index}
                            style={{
                              position: "relative",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              marginBottom: index < site.topPages.length - 1 ? "8px" : "0",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: `${barWidth}%`,
                                backgroundColor: "#10b981",
                                opacity: 0.25,
                                borderRadius: "6px",
                                paddingTop: "8px",
                                paddingBottom: "8px",
                              }}
                            />
                            <div
                              style={{
                                position: "relative",
                                zIndex: 10,
                                marginLeft: "8px",
                                marginRight: "8px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <Text className="text-darkText text-sm m-0 truncate max-w-[280px]">{page.value}</Text>
                              <div className="flex items-center gap-3">
                                <Text className="text-mutedText text-xs m-0">{safeToFixed(page.percentage, 1)}%</Text>
                                <Text className="text-darkText text-sm font-medium m-0">
                                  {formatNumber(page.count)}
                                </Text>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Top Referrers */}
                  {site.topReferrers.length > 0 && (
                    <div className="bg-cardBg border border-borderColor rounded-lg p-4 mb-4">
                      <Text className="text-darkText text-sm font-semibold mb-3 mt-0">Top Referrers</Text>
                      {site.topReferrers.map((referrer, index) => {
                        const ratio = site.topReferrers[0]?.percentage ? 100 / site.topReferrers[0].percentage : 1;
                        const barWidth = (referrer.percentage ?? 0) * ratio;
                        return (
                          <div
                            key={index}
                            style={{
                              position: "relative",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              marginBottom: index < site.topReferrers.length - 1 ? "8px" : "0",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: `${barWidth}%`,
                                backgroundColor: "#10b981",
                                opacity: 0.25,
                                borderRadius: "6px",
                                paddingTop: "8px",
                                paddingBottom: "8px",
                              }}
                            />
                            <div
                              style={{
                                position: "relative",
                                zIndex: 10,
                                marginLeft: "8px",
                                marginRight: "8px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${referrer.value}&sz=16`}
                                  alt=""
                                  width="16"
                                  height="16"
                                  style={{ flexShrink: 0 }}
                                />
                                <Text className="text-darkText text-sm m-0 truncate">{referrer.value}</Text>
                              </div>
                              <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                                <Text className="text-mutedText text-xs m-0">
                                  {safeToFixed(referrer.percentage, 1)}%
                                </Text>
                                <Text className="text-darkText text-sm font-medium m-0">
                                  {formatNumber(referrer.count)}
                                </Text>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Device Breakdown */}
                  {site.deviceBreakdown.length > 0 && (
                    <div className="bg-cardBg border border-borderColor rounded-lg p-4">
                      <Text className="text-darkText text-sm font-semibold mb-3 mt-0">Device Breakdown</Text>
                      {site.deviceBreakdown.map((device, index) => {
                        const ratio = site.deviceBreakdown[0]?.percentage
                          ? 100 / site.deviceBreakdown[0].percentage
                          : 1;
                        const barWidth = (device.percentage ?? 0) * ratio;
                        return (
                          <div
                            key={index}
                            style={{
                              position: "relative",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              marginBottom: index < site.deviceBreakdown.length - 1 ? "8px" : "0",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: `${barWidth}%`,
                                backgroundColor: "#10b981",
                                opacity: 0.25,
                                borderRadius: "6px",
                                paddingTop: "8px",
                                paddingBottom: "8px",
                              }}
                            />
                            <div
                              style={{
                                position: "relative",
                                zIndex: 10,
                                marginLeft: "8px",
                                marginRight: "8px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <Text className="text-darkText text-sm m-0 capitalize">{device.value}</Text>
                              <div className="flex items-center gap-3">
                                <Text className="text-mutedText text-xs m-0">{safeToFixed(device.percentage, 1)}%</Text>
                                <Text className="text-darkText text-sm font-medium m-0">
                                  {formatNumber(device.count)}
                                </Text>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dashboard Link */}
                <div className="text-center mb-6">
                  <Link
                    href={`https://app.rybbit.io/${site.siteId}`}
                    className="inline-block bg-brand text-white px-6 py-2.5 rounded-md font-medium text-sm no-underline"
                  >
                    View Full Dashboard
                  </Link>
                </div>
              </Section>
            ))}

            {/* Footer */}
            <Section className="text-center border-t border-borderColor pt-5">
              <Text className="text-mutedText text-xs mb-2">
                This weekly report covers the last 7 days of analytics data.
              </Text>
              <Text className="text-mutedText text-xs">© {currentYear} Rybbit Analytics</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
