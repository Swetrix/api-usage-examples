import { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { ClockIcon, EyeIcon, UserIcon, WifiIcon } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const formatDuration = (duration) => {
  let totalSeconds = Math.round(duration);

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  totalSeconds %= 3600;
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

const getFaviconLink = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return null;
  }
};

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitors, setVisitors] = useState({
    sessions: 0,
    pageviews: 0,
    avgSessionDuration: 0,
  });
  const [referrers, setReferrers] = useState([]);
  const [weeklyTraffic, setWeeklyTraffic] = useState({
    days: [],
    counts: [],
  });

  console.log("visitors", visitors);
  console.log("referrers", referrers);
  console.log("weeklyTraffic", weeklyTraffic);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const birdseyeResponse = await axios.get(
          "https://api.swetrix.com/v1/log/birdseye",
          {
            params: { pid: "STEzHcB1rALV", period: "7d" },
          },
        );

        const visitorResponse = await axios.get(
          "https://api.swetrix.com/v1/log",
          {
            params: {
              pid: "STEzHcB1rALV",
              timeBucket: "day",
              period: "7d",
            },
            headers: {
              "X-Api-Key": import.meta.env?.VITE_SWETRIX_API_KEY || "",
            },
          },
        );

        const { current } = birdseyeResponse.data["STEzHcB1rALV"] || {};

        const { chart, params } = visitorResponse.data;

        setVisitors({
          sessions: current.unique,
          pageviews: current.all,
          avgSessionDuration: current.sdur,
        });

        // Extract referrers from API response
        const referrerSources = params.ref
          .map((ref) => ({
            name: ref.name,
            percentage: Math.round((ref.count / current.unique) * 100),
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 6);

        setReferrers(referrerSources);

        // Extract weekly traffic data from the chart
        const days = chart.x
          .map((date) => {
            const day = new Date(date)
              .toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              .toUpperCase();
            return day;
          })
          .slice(-7);

        const counts = chart.visits.slice(-7);

        setWeeklyTraffic({
          days,
          counts,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const weeklyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  const weeklyChartData = {
    labels: weeklyTraffic.days,
    datasets: [
      {
        label: "Visits",
        data: weeklyTraffic.counts,
        backgroundColor: "#cc3333",
        borderRadius: 8,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl font-semibold">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl font-semibold text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-12">
        <h2 className="mb-8 text-center text-4xl font-bold">VISITORS</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 font-semibold text-gray-400 uppercase">
              SESSIONS
            </div>
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
              <UserIcon className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-6xl font-bold text-red-700">
              {visitors.sessions}
            </div>
          </div>

          <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 font-semibold text-gray-400 uppercase">
              TOTAL PAGEVIEWS
            </div>
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
              <EyeIcon className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-6xl font-bold text-red-700">
              {visitors.pageviews}
            </div>
          </div>

          <div className="flex flex-col items-center rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 font-semibold text-gray-400 uppercase">
              AVERAGE SESSION DURATION
            </div>
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
              <ClockIcon className="h-12 w-12 text-gray-400" />
            </div>
            <div className="text-6xl font-bold text-red-700">
              {formatDuration(visitors.avgSessionDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Referring Websites */}
      <div className="mb-12">
        <h2 className="mb-8 text-center text-4xl font-bold">
          TOP REFERRING WEBSITES
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {referrers.map((referrer, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-lg bg-white p-6 shadow-md"
            >
              <div className="mb-2 text-gray-600">{referrer.name}</div>
              <div className="mb-4 text-4xl font-bold text-red-700">
                {referrer.percentage}%
              </div>
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 36 36" className="h-full w-full">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#EEEEEE"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#cc3333"
                    strokeWidth="3"
                    strokeDasharray={`${referrer.percentage}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {getFaviconLink(referrer.name) ? (
                    <img
                      src={getFaviconLink(referrer.name)}
                      alt={referrer.name}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <WifiIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic for the Week */}
      <div>
        <h2 className="mb-8 text-center text-4xl font-bold">
          TRAFFIC FOR THE WEEK
        </h2>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="h-80 w-full">
            <Bar options={weeklyChartOptions} data={weeklyChartData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
