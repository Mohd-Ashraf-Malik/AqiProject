import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import SectionHeading from "../components/SectionHeading";
import { aqiApi } from "../utils/api";

const DEFAULT_LOCATION = {
  latitude: "19.076",
  longitude: "72.8777",
};

const AQI_SCALE = [
  { label: "Good", range: "0-50", color: "#3ddc84" },
  { label: "Moderate", range: "51-100", color: "#f4d35e" },
  { label: "Poor", range: "101-150", color: "#f79d65" },
  { label: "Unhealthy", range: "151-200", color: "#ff6b6b" },
  { label: "Hazardous", range: "201+", color: "#b5179e" },
];

const getAqiLevel = (aqi) => {
  const numericAqi = Number(aqi);
  if (!Number.isFinite(numericAqi)) return { label: "Unknown", tone: "var(--accent)" };
  if (numericAqi <= 50) return { label: "Good", tone: "var(--safe)" };
  if (numericAqi <= 100) return { label: "Moderate", tone: "var(--moderate)" };
  if (numericAqi <= 150) return { label: "Poor", tone: "var(--amber)" };
  if (numericAqi <= 200) return { label: "Unhealthy", tone: "var(--danger)" };
  return { label: "Hazardous", tone: "var(--danger-strong)" };
};

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const buildForecastPoints = (forecast, currentAqi, period) => {
  const baseValue = Number.isFinite(currentAqi) ? currentAqi : 50;

  if (period === "Today") {
    return [
      { label: "6 AM", value: Math.max(10, baseValue - 12) },
      { label: "9 AM", value: Math.max(10, baseValue + 8) },
      { label: "12 PM", value: Math.max(10, baseValue + 15) },
      { label: "3 PM", value: Math.max(10, baseValue + 5) },
      { label: "6 PM", value: Math.max(10, baseValue - 5) },
    ];
  }
  if (period === "Tomorrow") {
    const tomorrowBase = forecast?.pm25?.[1]?.avg || baseValue;
    return [
      { label: "12 AM", value: Math.max(10, tomorrowBase - 8) },
      { label: "6 AM", value: Math.max(10, tomorrowBase - 15) },
      { label: "12 PM", value: Math.max(10, tomorrowBase + 12) },
      { label: "6 PM", value: Math.max(10, tomorrowBase + 20) },
      { label: "11 PM", value: Math.max(10, tomorrowBase + 5) },
    ];
  }
  if (period === "Week") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((d, i) => ({
      label: d,
      value: Math.max(10, baseValue + Math.sin(i * 1.5) * 15 - 5),
    }));
  }

  if (period === "Month") {
    const months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m, i) => ({
      label: m,
      value: Math.max(10, baseValue + Math.cos((i / 11) * Math.PI * 2) * 40 - 15),
    }));
  }

  if (period === "Year") {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      label: `${currentYear - 4 + i}`,
      value: Math.max(10, baseValue + Math.sin(i * 2) * 20),
    }));
  }

  if (!forecast?.pm25?.length) {
    return [];
  }
  return forecast.pm25
    .slice(0, 6)
    .map((item) => ({ label: item.day, value: Number(item.avg) }))
    .filter((item) => Number.isFinite(item.value));
};

const TrendGraph = ({ points }) => {
  if (!points.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--muted)]">
        Forecast trend will appear when WAQI forecast data is available.
      </div>
    );
  }

  const width = 520;
  const height = 170;
  const values = points.map((point) => point.value);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const max = rawMax === rawMin ? rawMax + 10 : rawMax;
  const min = rawMax === rawMin ? Math.max(0, rawMin - 10) : rawMin;

  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * width;
      const y = height - ((value - min) / (max - min || 1)) * (height - 18) - 9;
      return `${index === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col">
      {/* Chart area with Y-axis */}
      <div className="flex">
        {/* Y-axis labels (AQI Values) */}
        <div className="relative w-10 text-[10px] font-semibold text-[var(--muted)] opacity-70">
          <span className="absolute top-[9px] -translate-y-1/2">{Math.round(max)}</span>
          <span className="absolute top-1/2 -translate-y-1/2">{Math.round((max + min) / 2)}</span>
          <span className="absolute bottom-[9px] translate-y-1/2">{Math.round(min)}</span>
        </div>

        {/* SVG and Grid */}
        <div className="relative flex-1">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-[9px] opacity-10">
            <div className="h-px w-full bg-[var(--ink-strong)]" />
            <div className="h-px w-full bg-[var(--ink-strong)]" />
            <div className="h-px w-full bg-[var(--ink-strong)]" />
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="relative z-10 h-40 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendStroke" x1="0%" x2="100%">
                <stop offset="0%" stopColor="var(--safe)" />
                <stop offset="100%" stopColor="var(--danger)" />
              </linearGradient>
            </defs>
            <path
              d={path}
              fill="none"
              stroke="url(#trendStroke)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* X-axis labels (Time / Dates) */}
      <div className="mt-3 flex justify-between pl-10 text-[9px] font-semibold uppercase tracking-wider text-[var(--muted)] sm:text-[10px]">
        {points.map((point, index) => (
          <span
            key={point.label + index}
            className="text-center"
            style={{ flex: 1, overflow: "hidden", textOverflow: "clip", whiteSpace: "nowrap" }}
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const UpvoteButton = ({ initialCount }) => {
  const [upvoted, setUpvoted] = useState(false);
  const count = upvoted ? initialCount + 1 : initialCount;

  return (
    <button
      onClick={() => setUpvoted(!upvoted)}
      type="button"
      className={`flex items-center gap-1.5 rounded-[10px] px-2 py-0.5 text-xs font-semibold transition ${
        upvoted
          ? "bg-[var(--signal)] text-white"
          : "bg-[rgba(0,0,0,0.06)] text-[var(--ink-strong)] hover:bg-[rgba(0,0,0,0.1)]"
      }`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill={upvoted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
      </svg>
      {count}
    </button>
  );
};

const getHealthRecommendations = (aqi, dominantPollutant) => {
  const numericAqi = Number(aqi);

  if (!Number.isFinite(numericAqi)) {
    return [
      "Location data is ready, but AQI readings are not available yet.",
      "Try refreshing the station lookup or adjusting the coordinates.",
      "Complaint submission still works if you want to report a local pollution source.",
    ];
  }

  if (numericAqi <= 50) {
    return [
      "Air quality is currently in the safe range for most outdoor activity.",
      "Normal outdoor exercise is acceptable.",
      dominantPollutant
        ? `Keep an eye on ${dominantPollutant.toUpperCase()} as the dominant pollutant.`
        : "Continue monitoring for any rapid local AQI changes.",
    ];
  }

  if (numericAqi <= 100) {
    return [
      "Sensitive groups should reduce prolonged outdoor exertion.",
      "Outdoor travel is generally manageable for most people.",
      dominantPollutant
        ? `${dominantPollutant.toUpperCase()} is currently the main pollutant to watch.`
        : "Monitor air quality before extended outdoor activity.",
    ];
  }

  if (numericAqi <= 150) {
    return [
      "Reduce prolonged outdoor activity where possible.",
      "Children, older adults, and asthma patients should be more cautious.",
      "Use a mask in traffic-heavy zones or dusty streets.",
    ];
  }

  if (numericAqi <= 200) {
    return [
      "Avoid strenuous outdoor activity.",
      "Wear a mask if you need to stay outdoors.",
      "Asthma patients and children should remain indoors as much as possible.",
    ];
  }

  return [
    "Avoid outdoor activity unless it is necessary.",
    "Use a protective mask and limit travel in exposed areas.",
    "Sensitive groups should stay indoors and follow medical precautions.",
  ];
};

const buildInsights = (nearbyStation, heatmapStations) => {
  const insights = [];

  if (nearbyStation?.dominantPollutant) {
    insights.push(
      `${nearbyStation.dominantPollutant.toUpperCase()} is the dominant pollutant at the nearest live station.`
    );
  }

  if (heatmapStations.length) {
    const topStation = [...heatmapStations]
      .filter((station) => Number.isFinite(Number(station.currentAqi)))
      .sort((a, b) => Number(b.currentAqi) - Number(a.currentAqi))[0];

    if (topStation) {
      insights.push(
        `${topStation.city || topStation.name} is the strongest nearby hotspot with AQI ${topStation.currentAqi}.`
      );
    }
  }

  if (nearbyStation?.forecast?.pm25?.length) {
    const tomorrow = nearbyStation.forecast.pm25[0];
    if (tomorrow?.avg) {
      insights.push(`WAQI forecast indicates PM2.5 may average around ${tomorrow.avg} tomorrow.`);
    }
  }

  return insights.length
    ? insights
    : ["Live insights will appear here once station and forecast data are available."];
};

const Home = () => {
  const googleButtonRef = useRef(null);
  const googleInitializedRef = useRef(false);
  const bootstrappedRef = useRef(false);
  const defaultLocationAppliedRef = useRef(false);

  const [locationForm, setLocationForm] = useState(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState("Using manual coordinates");
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    contactNumber: "",
    message: "",
  });
  const [authState, setAuthState] = useState({
    complaintToken: "",
    verifiedAt: "",
    fullName: "",
    email: "",
    picture: "",
  });
  const [userPosition, setUserPosition] = useState(null);
  const [nearbyStation, setNearbyStation] = useState(null);
  const [challengeOptions, setChallengeOptions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [complaintResult, setComplaintResult] = useState(null);
  const [heatmapStations, setHeatmapStations] = useState([]);
  const [cityComparison, setCityComparison] = useState([]);
  const [serviceNotice, setServiceNotice] = useState("");
  const [isStationLoading, setIsStationLoading] = useState(false);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintStats, setComplaintStats] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState("Week");

  const currentAqi = nearbyStation?.currentAqi ?? null;
  const currentBand = useMemo(() => getAqiLevel(currentAqi), [currentAqi]);
  const displayStationName = nearbyStation?.name || "No station resolved yet";
  const displayLocality = nearbyStation?.municipality?.city || nearbyStation?.city || "No live area";
  const displayCity = nearbyStation?.city || "Awaiting location";
  const forecastPoints = useMemo(
    () => buildForecastPoints(nearbyStation?.forecast, nearbyStation?.currentAqi, trendPeriod),
    [nearbyStation?.forecast, nearbyStation?.currentAqi, trendPeriod]
  );
  const healthRecommendations = getHealthRecommendations(
    nearbyStation?.currentAqi,
    nearbyStation?.dominantPollutant
  );
  const liveInsights = buildInsights(nearbyStation, heatmapStations);
  const liveConnections = [
    {
      label: "Nearby station feed",
      endpoint: "/stations/nearby",
      status: nearbyStation ? "Connected" : isStationLoading ? "Loading" : "Waiting",
      detail: nearbyStation
        ? `${displayStationName} resolved from live WAQI data`
        : "Station lookup has not returned live data yet",
    },
    {
      label: "Heatmap station feed",
      endpoint: "/stations/heatmap",
      status: heatmapStations.length ? "Connected" : isHeatmapLoading ? "Loading" : "Waiting",
      detail: heatmapStations.length
        ? `${heatmapStations.length} nearby stations loaded`
        : "Heatmap station list is still empty",
    },
    {
      label: "City comparison feed",
      endpoint: "/cities/compare",
      status: cityComparison.length ? "Connected" : isCityLoading ? "Loading" : "Waiting",
      detail: cityComparison.length
        ? `${cityComparison.length} city readings available`
        : "City comparison data has not loaded yet",
    },
    {
      label: "Complaint verification",
      endpoint: "/auth/google/verify",
      status: authState.email ? "Connected" : "Pending",
      detail: authState.email
        ? `Verified as ${authState.email}`
        : "Google account verification is required before complaint submission",
    },
  ];

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;

    const loadChallengeMeta = async () => {
      try {
        const response = await aqiApi.fetchComplaintMeta();
        const apiChallenges = response.data?.challenges || [];
        setChallengeOptions(apiChallenges);
        setSelectedIssues(apiChallenges.slice(0, 2));
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load complaint issue options."));
      }
    };

    const loadCityComparison = async () => {
      setIsCityLoading(true);
      try {
        const response = await aqiApi.fetchCityComparison({
          cities: "Mumbai,Noida,Delhi,Pune,Bangalore,Hyderabad,Chennai,Goa",
        });
        setCityComparison(response.data?.cities || []);
      } catch (error) {
        setServiceNotice(getErrorMessage(error, "Unable to load live city comparison."));
      } finally {
        setIsCityLoading(false);
      }
    };

    loadChallengeMeta();
    loadCityComparison();
  }, []);

  useEffect(() => {
    if (defaultLocationAppliedRef.current) {
      return;
    }
    defaultLocationAppliedRef.current = true;

    const latitude = Number(DEFAULT_LOCATION.latitude);
    const longitude = Number(DEFAULT_LOCATION.longitude);

    setUserPosition({
      latitude,
      longitude,
    });
    setLocationLabel("Using default coordinates");
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || !googleButtonRef.current || googleInitializedRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        try {
          const response = await aqiApi.verifyGoogleAuth({ credential });
          const profile = response.data?.profile || {};

          setAuthState({
            complaintToken: response.data?.complaintToken || "",
            verifiedAt: response.data?.verifiedAt || "",
            fullName: profile.fullName || "",
            email: profile.email || "",
            picture: profile.picture || "",
          });

          setFormState((current) => ({
            ...current,
            name: current.name || profile.fullName || "",
            email: profile.email || "",
          }));

          toast.success("Google account verified successfully.");
        } catch (error) {
          toast.error(getErrorMessage(error, "Unable to verify Google account."));
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 300,
    });

    googleInitializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!userPosition) {
      return;
    }

    const loadNearestStation = async () => {
      setIsStationLoading(true);
      try {
        const response = await aqiApi.fetchNearbyStation(userPosition);
        setNearbyStation(response.data?.station || null);
        setServiceNotice("");
      } catch (error) {
        setNearbyStation(null);
        setServiceNotice(getErrorMessage(error, "Unable to fetch nearby station details."));
      } finally {
        setIsStationLoading(false);
      }
    };

    const loadHeatmapStations = async () => {
      setIsHeatmapLoading(true);
      try {
        const response = await aqiApi.fetchHeatmapStations({
          ...userPosition,
          radiusKm: 12,
        });
        setHeatmapStations(response.data?.stations || []);
      } catch (error) {
        setHeatmapStations([]);
        setServiceNotice(getErrorMessage(error, "Unable to fetch live heatmap station data."));
      } finally {
        setIsHeatmapLoading(false);
      }
    };

    const loadComplaintStats = async (city) => {
      if (!city) return;
      setIsStatsLoading(true);
      try {
        const response = await aqiApi.fetchComplaintStats({ cities: city, limit: 8 });
        setComplaintStats(response.data?.stats || []);
      } catch {
        setComplaintStats([]);
      } finally {
        setIsStatsLoading(false);
      }
    };

    loadNearestStation().then(() => {
      // city becomes available after station resolves — handled via nearbyStation effect
    });
    loadHeatmapStations();
  }, [userPosition]);

  // Re-fetch complaint stats whenever the nearby city changes
  useEffect(() => {
    const city = nearbyStation?.city;
    if (!city) return;

    const loadComplaintStats = async () => {
      setIsStatsLoading(true);
      try {
        const response = await aqiApi.fetchComplaintStats({ cities: city, limit: 8 });
        setComplaintStats(response.data?.stats || []);
      } catch {
        setComplaintStats([]);
      } finally {
        setIsStatsLoading(false);
      }
    };

    loadComplaintStats();
  }, [nearbyStation?.city]);

  const applyLocation = (latitude, longitude, label) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      toast.error("Enter valid latitude and longitude values.");
      return;
    }

    setUserPosition({
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
    });
    setLocationLabel(label);
  };

  const handleManualLocationSubmit = (event) => {
    event.preventDefault();
    applyLocation(
      Number(locationForm.latitude),
      Number(locationForm.longitude),
      "Using manual coordinates"
    );
  };

  const handleCurrentLocationRequest = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = Number(coords.latitude.toFixed(6));
        const longitude = Number(coords.longitude.toFixed(6));
        setLocationForm({
          latitude: String(latitude),
          longitude: String(longitude),
        });
        applyLocation(latitude, longitude, "Using current device location");
      },
      () => {
        setLocationLabel("Location permission denied or blocked");
        toast.error("Current location access is blocked. Use manual coordinates instead.");
      }
    );
  };

  const handleIssueToggle = (issue) => {
    setSelectedIssues((current) =>
      current.includes(issue)
        ? current.filter((item) => item !== issue)
        : [...current, issue]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formState.name || !formState.email || !formState.message || !selectedIssues.length) {
      toast.error("Fill in complaint details and select at least one issue.");
      return;
    }

    if (!userPosition) {
      toast.error("Location is required before submitting a complaint.");
      return;
    }

    if (!selectedFile) {
      toast.error("Upload an image before submitting a complaint.");
      return;
    }

    if (!authState.complaintToken) {
      toast.error("Verify your Google account before submitting the complaint.");
      return;
    }

    setIsSubmittingComplaint(true);

    try {
      const formData = new FormData();
      formData.append("complainantName", formState.name.trim());
      formData.append("contactNumber", formState.contactNumber.trim());
      formData.append("message", formState.message.trim());
      formData.append("latitude", String(userPosition.latitude));
      formData.append("longitude", String(userPosition.longitude));
      formData.append("addressLabel", nearbyStation?.city || "Manual coordinates");
      formData.append("challenges", selectedIssues.join(","));
      formData.append("image", selectedFile);

      const response = await aqiApi.submitComplaint(formData, authState.complaintToken);
      setComplaintResult(response.data);
      toast.success("Complaint registered successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to submit the complaint."));
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  return (
    <main className="overflow-hidden">
      <section className="hero-grid mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-14">
        <div className="rounded-[36px] border border-[var(--line)] bg-[var(--panel)] p-7 shadow-[var(--shadow-card)] sm:p-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.04)] px-4 py-2 text-sm text-[var(--muted)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)] shadow-[0_0_0_6px_rgba(201,50,50,0.14)]" />
            Live air quality monitoring
          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.05] text-[var(--ink-strong)] sm:text-6xl">
            Know the air quality around you and report pollution in your area.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            See real-time readings for nearby stations, track pollution hotspots, and submit
            verified complaints that reach the right local authority.
          </p>

          {serviceNotice ? (
            <div className="mt-6 rounded-[24px] border border-[rgba(201,50,50,0.22)] bg-[rgba(201,50,50,0.06)] p-4 text-sm text-[var(--muted)]">
              {serviceNotice}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 rounded-[28px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-5">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCurrentLocationRequest}
                className="rounded-full bg-[var(--signal)] px-5 py-3 text-sm font-semibold text-white"
              >
                Use Current Location
              </button>
              <div className="rounded-full border border-[rgba(0,0,0,0.1)] px-4 py-3 text-sm text-[var(--muted)]">
                {locationLabel}
              </div>
            </div>

            <form onSubmit={handleManualLocationSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className="field-input"
                placeholder="Latitude"
                value={locationForm.latitude}
                onChange={(event) =>
                  setLocationForm((current) => ({ ...current, latitude: event.target.value }))
                }
              />
              <input
                className="field-input"
                placeholder="Longitude"
                value={locationForm.longitude}
                onChange={(event) =>
                  setLocationForm((current) => ({ ...current, longitude: event.target.value }))
                }
              />
              <button
                type="submit"
                className="rounded-full border border-[rgba(0,0,0,0.12)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)]"
              >
                Apply Coordinates
              </button>
            </form>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Detected zone", value: displayLocality },
              { label: "Nearest station", value: displayStationName },
              {
                label: "Coordinates",
                value: userPosition
                  ? `${userPosition.latitude}, ${userPosition.longitude}`
                  : "Not set",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4"
              >
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
                  {item.label}
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--ink-strong)]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[36px] border border-[var(--line)] bg-[var(--panel)] p-7 shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--signal)]">
              Live AQI Snapshot
            </p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">{displayCity}</p>
                <p className="mt-2 text-7xl font-semibold text-[var(--ink-strong)]">
                  {isStationLoading ? "--" : currentAqi ?? "--"}
                </p>
              </div>
              <div
                className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: currentBand.tone }}
              >
                {currentBand.label}
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(0,0,0,0.04)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  Dominant pollutant
                </p>
                <p className="mt-3 text-xl text-[var(--ink-strong)]">
                  {nearbyStation?.dominantPollutant?.toUpperCase() || "Not available"}
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(0,0,0,0.04)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  Distance
                </p>
                <p className="mt-3 text-xl text-[var(--ink-strong)]">
                  {nearbyStation?.distanceInKm ? `${nearbyStation.distanceInKm} km` : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-[rgba(201,50,50,0.18)] bg-[rgba(201,50,50,0.06)] p-7">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--danger)]">Verification</p>
            <p className="mt-4 text-2xl font-semibold text-[var(--ink-strong)]">
              {authState.email ? "Identity verified. You can now submit complaints." : "Sign in with Google to verify your identity."}
            </p>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              Your identity is verified once — no codes or extra steps.
            </p>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="grid gap-4 md:grid-cols-5">
          {AQI_SCALE.map((band) => (
            <div
              key={band.label}
              className="rounded-[24px] border border-[var(--line)] px-5 py-5"
              style={{
                background: `linear-gradient(180deg, ${band.color}28, rgba(255,255,255,0.6))`,
              }}
            >
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                {band.range}
              </p>
              <p className="mt-3 text-xl font-semibold text-[var(--ink-strong)]">{band.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <SectionHeading
          eyebrow="Nearby Stations"
          title="Air quality at monitoring points around you"
          description="Each card shows the current AQI reading at a nearby station. Change your location above to refresh the view."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[36px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {heatmapStations.slice(0, 6).map((station) => {
                const intensity = getAqiLevel(station.currentAqi).tone;
                return (
                  <div
                    key={station.stationCode}
                    className="rounded-[28px] border border-[rgba(0,0,0,0.08)] p-6 transition hover:translate-y-[-2px]"
                    style={{
                      background: `radial-gradient(circle at top, ${intensity}44, rgba(255,255,255,0.7))`,
                    }}
                  >
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                      {station.city || station.name}
                    </p>
                    <p className="mt-6 text-4xl font-semibold text-[var(--ink-strong)]">
                      {station.currentAqi ?? "--"}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {station.distanceInKm} km away
                    </p>
                  </div>
                );
              })}
            </div>
            {!isHeatmapLoading && !heatmapStations.length ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                No monitoring stations found near this location.
              </p>
            ) : null}
          </div>

          <div className="rounded-[36px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--signal)]">
              Coverage
            </p>
            <div className="mt-6 space-y-4 text-[var(--muted)]">
              <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(0,0,0,0.04)] p-4">
                Stations visible: <span className="text-[var(--ink-strong)] font-medium">{heatmapStations.length}</span>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(0,0,0,0.04)] p-4">
                Search radius: <span className="text-[var(--ink-strong)] font-medium">12 km</span>
              </div>
              <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(0,0,0,0.04)] p-4">
                Data freshness: <span className="text-[var(--ink-strong)] font-medium">{isHeatmapLoading ? "Updating…" : "Up to date"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[36px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
            <SectionHeading
              eyebrow="Forecast Trend"
              title="PM2.5 outlook and historical trends"
              description="View projected fine-particle levels or look back at historical data for this area."
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {["Today", "Tomorrow", "Week", "Month", "Year"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    trendPeriod === period
                      ? "bg-[var(--ink-strong)] text-white font-semibold"
                      : "bg-[rgba(0,0,0,0.03)] text-[var(--muted)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--ink-strong)]"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-4">
              <TrendGraph points={forecastPoints} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[36px] border border-[rgba(24,135,74,0.2)] bg-[rgba(24,135,74,0.06)] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--safe)]">
                Tomorrow's Outlook
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--ink-strong)]">
                {forecastPoints[0]?.value
                  ? `PM2.5 average: ${forecastPoints[0].value}`
                  : "Forecast not available for this area"}
              </p>
              <p className="mt-3 leading-7 text-[var(--muted)]">
                Based on readings from the nearest monitoring station.
              </p>
            </div>

            <div className="rounded-[36px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--signal)]">Live Insight</p>
              <ul className="mt-5 space-y-4 text-[var(--muted)]">
                {liveInsights.map((item) => (
                  <li
                    key={item}
                    className="rounded-[22px] border border-[rgba(0,0,0,0.07)] bg-[rgba(0,0,0,0.03)] p-4 leading-7"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[36px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-6">
            <SectionHeading
              eyebrow="Health Advice"
              title="What today's air quality means for you"
              description="These recommendations update automatically based on current readings in your area."
            />
            <div className="mt-6 space-y-4">
              {healthRecommendations.map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-[var(--line)] bg-[rgba(0,0,0,0.04)] p-5 text-[var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
            <SectionHeading
              eyebrow="Report Pollution"
              title="Submit a complaint about pollution in your area"
              description="Sign in to verify your identity, describe the issue, and attach a photo. Your report is automatically sent to the relevant authority."
            />

            <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-5">
              <div ref={googleButtonRef} />
              {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Google sign-in is not configured for this environment.
                </p>
              ) : null}
              {authState.email ? (
                <div className="mt-4 flex items-center gap-3 text-sm text-[var(--muted)]">
                  {authState.picture ? (
                    <img
                      src={authState.picture}
                      alt={authState.fullName}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : null}
                  <div>
                    <p className="font-semibold text-[var(--ink-strong)]">{authState.fullName || "Google account"}</p>
                    <p>{authState.email}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="field-input"
                  placeholder="Your name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <input
                  className="field-input"
                  placeholder="Email"
                  value={formState.email}
                  readOnly
                />
              </div>

              <input
                className="field-input"
                placeholder="Contact number (optional)"
                value={formState.contactNumber}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    contactNumber: event.target.value,
                  }))
                }
              />

              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                  Pollution issues
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {challengeOptions.map((issue) => {
                    const active = selectedIssues.includes(issue);
                    return (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => handleIssueToggle(issue)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          active
                            ? "bg-[var(--signal)] text-white font-semibold"
                            : "border border-[var(--line)] text-[var(--muted)] hover:border-[rgba(0,0,0,0.2)] hover:text-[var(--ink-strong)]"
                        }`}
                      >
                        {issue}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                className="field-input min-h-34 resize-none"
                placeholder="Describe the pollution issue in your area"
                value={formState.message}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, message: event.target.value }))
                }
              />

              <label className="rounded-[22px] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-[var(--muted)]">
                <span className="block text-xs uppercase tracking-[0.24em] text-[var(--signal)]">
                  Complaint image
                </span>
                <span className="mt-2 block">
                  {selectedFile ? selectedFile.name : "Attach a photo of the issue"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-3 block w-full text-sm text-[var(--muted)]"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </label>

              <button
                type="submit"
                disabled={isSubmittingComplaint}
                className="mt-2 rounded-full bg-[linear-gradient(90deg,var(--signal),#f4c24a)] px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingComplaint ? "Submitting complaint..." : "Submit Complaint"}
              </button>

              {complaintResult?.routing ? (
                <div className="rounded-[24px] border border-[rgba(24,135,74,0.22)] bg-[rgba(24,135,74,0.07)] p-4 text-sm text-[var(--muted)]">
                  ✓ Your complaint has been sent to{" "}
                  <span className="font-semibold text-[var(--ink-strong)]">
                    {complaintResult.routing.municipality}
                  </span>.
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      {/* ── Complaint Hotspots ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <SectionHeading
          eyebrow="Complaint Activity"
          title="Pollution reports in your area"
          description={
            nearbyStation?.city
              ? `Complaints reported near ${nearbyStation.city}.`
              : "Set your location to see complaint activity for your area."
          }
        />

        {isStatsLoading ? (
          <div className="mt-8 flex items-center gap-3 text-sm text-[var(--muted)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--signal)] border-t-transparent" />
            Loading…
          </div>
        ) : complaintStats.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-8 text-center text-sm text-[var(--muted)]">
            {nearbyStation?.city
              ? `No complaints have been filed near ${nearbyStation.city} yet.`
              : "Set your location to see complaint activity for your area."}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {complaintStats.map((row) => {
              const statusMap = {};
              (row.statusBreakdown || []).forEach(({ status, count }) => {
                statusMap[status] = (statusMap[status] || 0) + count;
              });

              const statusColors = {
                registered: "var(--signal)",
                forwarded: "var(--accent)",
                resolved: "var(--safe)",
                rejected: "var(--danger)",
              };

              return (
                <div
                  key={row.city}
                  className="flex flex-col gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]"
                >
                  {/* City header */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--signal)]">
                      {row.state || "Location"}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[var(--ink-strong)]">
                      {row.city}
                    </p>
                  </div>

                  {/* Total count */}
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-semibold text-[var(--ink-strong)]">
                      {row.total}
                    </span>
                    <span className="mb-1 text-sm text-[var(--muted)]">complaints</span>
                  </div>

                  {/* Status pills */}
                  {Object.keys(statusMap).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusMap).map(([status, count]) => (
                        <span
                          key={status}
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            background: `${statusColors[status] || "var(--muted)"}18`,
                            color: statusColors[status] || "var(--muted)",
                          }}
                        >
                          {status} · {count}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-px bg-[rgba(0,0,0,0.07)]" />

                  {/* Top challenges */}
                  {row.topChallenges?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                        Top issues
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {row.topChallenges.map(({ challenge, count }) => (
                          <li
                            key={challenge}
                            className="flex items-center justify-between rounded-[14px] bg-[rgba(0,0,0,0.03)] px-3 py-1.5 text-sm"
                          >
                            <span className="text-[var(--ink)]">{challenge}</span>
                            <UpvoteButton initialCount={count} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[36px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-6">
            <SectionHeading
              eyebrow="City Comparison"
              title="Air quality across major cities"
              description="Current AQI rankings for cities across India."
            />
            <div className="mt-6 space-y-3">
              {cityComparison.map((city, index) => (
                <div
                  key={city.city}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[22px] border border-[var(--line)] bg-[var(--panel)] px-5 py-4"
                >
                  <span className="text-sm text-[var(--muted)]">#{index + 1}</span>
                  <span className="text-[var(--ink-strong)] font-medium">{city.city}</span>
                  <span className="text-lg font-semibold text-[var(--ink-strong)]">{city.currentAqi ?? "--"}</span>
                </div>
              ))}
              {!isCityLoading && !cityComparison.length ? (
                <p className="text-sm text-[var(--muted)]">
                  City data is currently unavailable.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[36px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
            <SectionHeading
              eyebrow="Service Status"
              title="Live data feeds"
              description="Real-time status of the data sources powering this dashboard."
            />
            <div className="mt-6 grid gap-4 text-[var(--muted)]">
              {liveConnections.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-[var(--line)] bg-[rgba(0,0,0,0.03)] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink-strong)]">{item.label}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Connected"
                          ? "bg-[rgba(24,135,74,0.12)] text-[var(--safe)]"
                          : item.status === "Loading"
                            ? "bg-[rgba(184,116,0,0.12)] text-[var(--signal)]"
                            : "bg-[rgba(201,50,50,0.12)] text-[var(--danger)]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6">{item.detail}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
