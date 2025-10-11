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
import type { OrganizationReport, SingleColData } from "../../../services/weeklyReportTypes.js";

interface WeeklyReportEmailProps {
  userName: string;
  organizationReport: OrganizationReport;
}

interface MetricCardProps {
  label: string;
  currentValue: string;
  growth: string;
  isPositive: boolean;
}

interface TopListItemProps {
  value: string;
  percentage: number | null;
  count: number;
  barWidth: number;
  isLast: boolean;
  favicon?: string;
  labelClassName?: string;
}

interface TopListSectionProps {
  title: string;
  items: SingleColData[];
  renderLabel: (item: SingleColData) => React.ReactNode;
  showFavicon?: boolean;
  labelClassName?: string;
  className?: string;
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

const MetricCard = ({ label, currentValue, growth, isPositive }: MetricCardProps) => (
  <div className="bg-cardBg border border-borderColor rounded-lg p-4">
    <Text className="text-mutedText text-xs mb-1 mt-0">{label}</Text>
    <div className="flex items-baseline gap-2">
      <Text className="text-darkText text-2xl font-bold m-0">{currentValue}</Text>
      <Text className={`text-xs font-medium m-0 ${isPositive ? "text-positive" : "text-negative"}`}>{growth}</Text>
    </div>
  </div>
);

const TopListItem = ({ value, percentage, count, barWidth, isLast, favicon, labelClassName }: TopListItemProps) => (
  <div
    style={{
      position: "relative",
      height: "24px",
      display: "flex",
      alignItems: "center",
      marginBottom: isLast ? "0" : "8px",
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
      {favicon ? (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden" }}>
          <img src={favicon} alt="" width="16" height="16" style={{ flexShrink: 0 }} />
          <Text className={labelClassName || "text-darkText text-sm m-0 truncate"}>{value}</Text>
        </div>
      ) : (
        <Text className={labelClassName || "text-darkText text-sm m-0"}>{value}</Text>
      )}
      <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
        <Text className="text-mutedText text-xs m-0">{safeToFixed(percentage, 1)}%</Text>
        <Text className="text-darkText text-sm font-medium m-0">{formatNumber(count)}</Text>
      </div>
    </div>
  </div>
);

const TopListSection = ({ title, items, renderLabel, showFavicon, labelClassName, className }: TopListSectionProps) => {
  if (items.length === 0) return null;

  const ratio = items[0]?.percentage ? 100 / items[0].percentage : 1;

  return (
    <div className={className || "bg-cardBg border border-borderColor rounded-lg p-4 mb-4"}>
      <Text className="text-darkText text-sm font-semibold mb-3 mt-0">{title}</Text>
      {items.map((item, index) => {
        const barWidth = (item.percentage ?? 0) * ratio;
        const favicon = showFavicon ? `https://www.google.com/s2/favicons?domain=${item.value}&sz=16` : undefined;

        return (
          <TopListItem
            key={index}
            value={typeof renderLabel(item) === "string" ? (renderLabel(item) as string) : item.value}
            percentage={item.percentage}
            count={item.count}
            barWidth={barWidth}
            isLast={index === items.length - 1}
            favicon={favicon}
            labelClassName={labelClassName}
          />
        );
      })}
    </div>
  );
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
                  <MetricCard
                    label="Sessions"
                    currentValue={formatNumber(site.currentWeek.sessions)}
                    growth={calculateGrowth(site.currentWeek.sessions, site.previousWeek.sessions)}
                    isPositive={site.currentWeek.sessions >= site.previousWeek.sessions}
                  />
                  <MetricCard
                    label="Pageviews"
                    currentValue={formatNumber(site.currentWeek.pageviews)}
                    growth={calculateGrowth(site.currentWeek.pageviews, site.previousWeek.pageviews)}
                    isPositive={site.currentWeek.pageviews >= site.previousWeek.pageviews}
                  />
                  <MetricCard
                    label="Unique Users"
                    currentValue={formatNumber(site.currentWeek.users)}
                    growth={calculateGrowth(site.currentWeek.users, site.previousWeek.users)}
                    isPositive={site.currentWeek.users >= site.previousWeek.users}
                  />
                  <MetricCard
                    label="Avg Duration"
                    currentValue={formatDuration(site.currentWeek.session_duration)}
                    growth={calculateGrowth(site.currentWeek.session_duration, site.previousWeek.session_duration)}
                    isPositive={site.currentWeek.session_duration >= site.previousWeek.session_duration}
                  />
                  <MetricCard
                    label="Pages/Session"
                    currentValue={safeToFixed(site.currentWeek.pages_per_session, 1)}
                    growth={calculateGrowth(site.currentWeek.pages_per_session, site.previousWeek.pages_per_session)}
                    isPositive={(site.currentWeek.pages_per_session ?? 0) >= (site.previousWeek.pages_per_session ?? 0)}
                  />
                  <MetricCard
                    label="Bounce Rate"
                    currentValue={`${safeToFixed(site.currentWeek.bounce_rate, 1)}%`}
                    growth={calculateGrowth(site.currentWeek.bounce_rate, site.previousWeek.bounce_rate)}
                    isPositive={(site.currentWeek.bounce_rate ?? 0) <= (site.previousWeek.bounce_rate ?? 0)}
                  />
                </div>

                {/* Top Lists Section */}
                <div className="mb-6">
                  <TopListSection
                    title="Top Countries"
                    items={site.topCountries}
                    renderLabel={item => getCountryDisplay(item.value)}
                  />
                  <TopListSection
                    title="Top Pages"
                    items={site.topPages}
                    renderLabel={item => item.value}
                    labelClassName="text-darkText text-sm m-0 truncate max-w-[280px]"
                  />
                  <TopListSection
                    title="Top Referrers"
                    items={site.topReferrers}
                    renderLabel={item => item.value}
                    showFavicon={true}
                    labelClassName="text-darkText text-sm m-0 truncate"
                  />
                  <TopListSection
                    title="Device Breakdown"
                    items={site.deviceBreakdown}
                    renderLabel={item => item.value}
                    labelClassName="text-darkText text-sm m-0 capitalize"
                    className="bg-cardBg border border-borderColor rounded-lg p-4"
                  />
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
